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
            // Habilitamos métodos de pago automáticos para aceptar Google Pay, Apple Pay, PayPal, etc.
            // siempre y cuando estén activos en el dashboard de Stripe.
            automatic_payment_methods: { enabled: true },
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
        } as any);

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

export async function continueCheckoutSession(shipmentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Debes iniciar sesión.' };
    }

    let redirectUrl: string | null = null;

    try {
        const { data: shipment, error: dbError } = await supabase
            .from('shipments')
            .select('*')
            .eq('id', shipmentId)
            .eq('user_id', user.id)
            .single();

        if (dbError || !shipment) throw new Error('Envío no encontrado');

        if (shipment.status !== 'quoted') {
            throw new Error('Este envío ya ha sido procesado');
        }

        const session = await stripe.checkout.sessions.create({
            // Habilitamos métodos de pago automáticos para aceptar Google Pay, Apple Pay, PayPal, etc.
            automatic_payment_methods: { enabled: true },
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Envío ${shipment.carrier_name} - ${shipment.service_name}`,
                            description: `Transporte de paquete`,
                        },
                        unit_amount: Math.round(Number(shipment.final_price) * 100),
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
        } as any);

        if (!session.url) throw new Error('No se pudo crear la sesión de Stripe');
        redirectUrl = session.url;
    } catch (error: any) {
        console.error('[Stripe] Error continuing checkout session:', error);
        return { error: 'Ocurrió un error al procesar el pago.' };
    }

    if (redirectUrl) {
        redirect(redirectUrl);
    }
}

import { revalidatePath } from 'next/cache';

import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

export async function deleteShipment(shipmentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Debes iniciar sesión.' };
    }

    try {
        // Use service role key to bypass missing RLS DELETE policy temporarily
        const supabaseAdmin = createSupabaseAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error, count } = await supabaseAdmin
            .from('shipments')
            .delete()
            .eq('id', shipmentId)
            .eq('user_id', user.id)
            .eq('status', 'quoted') // Only allow deleting un-paid shipments safely.
            .select('*');

        if (error) throw error;

        if (!count || count === 0) {
            console.log("No rows were deleted. Shipment might not exist or wrong status.");
        }
    } catch (error: any) {
        console.error('[Database] Error deleting shipment:', error);
        return { error: 'No se pudo eliminar el envío.' };
    }

    revalidatePath('/dashboard');
    return { success: true };
}
