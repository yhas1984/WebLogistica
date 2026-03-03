'use server';

import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createCheckoutSession(rateId: string, rateData: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Debes iniciar sesión para realizar un envío.' };
    }

    let redirectUrl: string | null = null;

    try {
        // Create a record in shipments table as 'quoted' or 'pending_payment'
        const { data: shipment, error: dbError } = await supabase
            .from('shipments')
            .insert({
                user_id: user.id,
                carrier_name: rateData.carrierName,
                service_name: rateData.serviceName,
                cost_price: rateData.costPrice,
                final_price: rateData.finalPrice,
                status: 'quoted',
                api_provider: rateData.provider,
                origin_data: rateData.origin || {},
                destination_data: rateData.destination || {},
                dimensions: rateData.dimensions || {},
            })
            .select()
            .single();

        if (dbError) throw dbError;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Envío ${rateData.carrierName} - ${rateData.serviceName}`,
                            description: `Transporte de paquete (${rateData.dimensions?.weight || 1}kg)`,
                        },
                        unit_amount: Math.round(rateData.finalPrice * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&shipment_id=${shipment.id}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?cancelled=true`,
            metadata: {
                shipmentId: shipment.id,
                userId: user.id,
            },
        });

        if (!session.url) throw new Error('No se pudo crear la sesión de Stripe');
        redirectUrl = session.url;
    } catch (error: any) {
        console.error('[Stripe] Error creating checkout session:', error);
        return { error: 'Ocurrió un error al procesar el pago. Inténtalo de nuevo.' };
    }

    if (redirectUrl) {
        redirect(redirectUrl);
    }
}
