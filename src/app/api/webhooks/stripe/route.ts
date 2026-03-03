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

        if (metadata) {
            try {
                const supabase = await createServiceClient();

                // Create shipment record
                const { error } = await supabase.from('shipments').insert({
                    status: 'paid',
                    api_provider: metadata.provider,
                    carrier_name: metadata.carrier_name,
                    service_name: metadata.service_name,
                    cost_price: parseFloat(metadata.cost_price || '0'),
                    final_price: parseFloat(metadata.final_price || '0'),
                    stripe_payment_id: session.payment_intent as string,
                    origin_data: {},
                    destination_data: {},
                    dimensions: {},
                });

                if (error) {
                    console.error('[Stripe Webhook] DB insert error:', error);
                }

                // TODO: Call carrier API to purchase actual label
                // TODO: Upload PDF to Supabase Storage
                // TODO: Update shipment with tracking_number and label_url
            } catch (error) {
                console.error('[Stripe Webhook] Processing error:', error);
            }
        }
    }

    return NextResponse.json({ received: true });
}
