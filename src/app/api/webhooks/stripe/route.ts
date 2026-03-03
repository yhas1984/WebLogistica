// ============================================================
// Stripe Webhook Handler
// Handles payment_intent.succeeded → purchase label
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('[Stripe Webhook] Signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (metadata && metadata.shipmentId) {
            try {
                const supabase = await createServiceClient();

                // Idempotency Check: Fetch current status
                const { data: currentShipment, error: fetchError } = await supabase
                    .from('shipments')
                    .select('status, stripe_payment_id')
                    .eq('id', metadata.shipmentId)
                    .single();

                if (fetchError) {
                    console.error('[Stripe Webhook] Error fetching shipment:', fetchError);
                    return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
                }

                if (currentShipment.status !== 'quoted') {
                    // Shipment is already paid or further along. Ignore duplicate webhook.
                    console.log(`[Stripe Webhook] Idempotent: Shipment ${metadata.shipmentId} already processed.`);
                    return NextResponse.json({ received: true, idempotent: true });
                }

                // Update shipment to 'paid' status securely
                const { error: updateError } = await supabase
                    .from('shipments')
                    .update({
                        status: 'paid',
                        stripe_payment_id: session.payment_intent as string || session.id
                    })
                    .eq('id', metadata.shipmentId)
                    .eq('status', 'quoted'); // Enforce status strictly for parallel reqs

                if (updateError) {
                    console.error('[Stripe Webhook] DB update error:', updateError);
                    throw updateError;
                }

                // TODO: Call carrier API to purchase actual label
                // TODO: Upload PDF to Supabase Storage
                // TODO: Update shipment with tracking_number and label_url
            } catch (error) {
                console.error('[Stripe Webhook] Processing error:', error);
                return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
