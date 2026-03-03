'use server';

// ============================================================
// Server Action: Create Stripe Checkout Session
// ============================================================

import { stripe } from '@/lib/stripe';
import type { CarrierRate } from '@/types';

export async function createCheckoutSession(
    rate: CarrierRate,
    returnUrl: string
): Promise<{ url: string | null; error?: string }> {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            return { url: null, error: 'Stripe no está configurado' };
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Envío ${rate.carrierName} — ${rate.serviceName}`,
                            description: `Entrega estimada: ${rate.estimatedDays} día(s) · Proveedor: ${rate.provider}`,
                        },
                        unit_amount: Math.round(rate.finalPrice * 100), // Stripe uses cents
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                rate_id: rate.id,
                provider: rate.provider,
                carrier_name: rate.carrierName,
                service_name: rate.serviceName,
                cost_price: String(rate.costPrice),
                final_price: String(rate.finalPrice),
            },
            success_url: `${returnUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${returnUrl}/checkout/cancel`,
        });

        return { url: session.url };
    } catch (error) {
        console.error('[createCheckoutSession] Error:', error);
        return { url: null, error: 'No se pudo crear la sesión de pago' };
    }
}
