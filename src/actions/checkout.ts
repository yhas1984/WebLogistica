'use server';

import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

// Helper dinámico para Vercel: Evita errores 400 de Stripe por URLs mal formadas
const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_BASE_URL) {
        return process.env.NEXT_PUBLIC_BASE_URL;
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    return 'http://localhost:3000';
};

export async function createCheckoutSession(rateId: string, rateData: any, origin: any, destination: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Debes iniciar sesión para realizar un envío.' };
    }

    // Seguridad: Evitar que se compren tarifas de demostración
    if (rateId.startsWith('demo-') || rateData.id?.startsWith('demo-')) {
        console.error('[Stripe] Attempted to purchase a demo rate:', rateId);
        return { error: 'No se pueden procesar pagos para tarifas de demostración. Por favor, realiza una nueva búsqueda y selecciona una tarifa real.' };
    }

    let redirectUrl: string | null = null;

    try {
        // Create a record in shipments table as 'pending_payment'
        // Try with extra columns first, fallback without them if columns don't exist yet
        const baseInsert = {
            user_id: user.id,
            carrier_name: rateData.carrierName,
            service_name: rateData.serviceName,
            cost_price: rateData.costPrice,
            final_price: rateData.finalPrice,
            status: 'pending_payment',
            api_provider: rateData.provider,
            origin_data: origin,
            destination_data: destination,
            dimensions: rateData.dimensions || {},
        };

        let shipment: any;
        let dbError: any;

        // Try with extra columns
        const result1 = await supabase
            .from('shipments')
            .insert({
                ...baseInsert,
                origin_postal_code: origin.postalCode,
                origin_country: origin.countryCode,
                destination_postal_code: destination.postalCode,
                destination_country: destination.countryCode,
            })
            .select()
            .single();

        if (result1.error?.code === '42703' || result1.error?.message?.includes('column')) {
            // Columns don't exist yet, insert without them
            const result2 = await supabase
                .from('shipments')
                .insert(baseInsert)
                .select()
                .single();
            shipment = result2.data;
            dbError = result2.error;
        } else {
            shipment = result1.data;
            dbError = result1.error;
        }

        if (dbError) throw dbError;

        const session = await stripe.checkout.sessions.create({
            // Note: The specific clover beta version of stripe forces the use of strict strings and does not support
            // automatic payment methods. 'card' covers Apple and Google Pay.
            // If the user hasn't enabled paypal or bizum in their stripe dashboard, it will crash, so we just pass card for now.
            payment_method_types: ['card'] as any,
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
            success_url: `${getBaseUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}&shipment_id=${shipment.id}`,
            cancel_url: `${getBaseUrl()}/checkout/cancel`,
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

        if (shipment.status !== 'pending_payment' && shipment.status !== 'quoted') {
            throw new Error('Este envío ya ha sido procesado');
        }

        const session = await stripe.checkout.sessions.create({
            // Note: The specific clover beta version of stripe forces the use of strict strings and does not support
            // automatic payment methods. 'card' covers Apple and Google Pay.
            // If the user hasn't enabled paypal or bizum in their stripe dashboard, it will crash, so we just pass card for now.
            payment_method_types: ['card'] as any,
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
            success_url: `${getBaseUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}&shipment_id=${shipment.id}`,
            cancel_url: `${getBaseUrl()}/checkout/cancel`,
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

// NOTE: revalidatePath and createSupabaseAdminClient imported at top of file

export async function deleteShipment(shipmentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Debes iniciar sesión.' };
    }

    try {
        // First try with user's authenticated client (requires RLS DELETE policy)
        const { error: rlsError, data: rlsData } = await supabase
            .from('shipments')
            .delete()
            .eq('id', shipmentId)
            .eq('user_id', user.id)
            .in('status', ['pending_payment', 'quoted'])
            .select();

        if (!rlsError && rlsData && rlsData.length > 0) {
            console.log('[Delete] Success via RLS:', rlsData.length, 'rows');
            revalidatePath('/dashboard');
            return { success: true };
        }

        // Fallback: use service role key for projects without DELETE policy
        console.log('[Delete] RLS delete returned 0 rows or error, trying admin...', rlsError);
        const supabaseAdmin = createSupabaseAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error, data: deletedData } = await supabaseAdmin
            .from('shipments')
            .delete()
            .eq('id', shipmentId)
            .eq('user_id', user.id) // Security: verify ownership
            .in('status', ['pending_payment', 'quoted'])
            .select();

        if (error) throw error;

        if (!deletedData || deletedData.length === 0) {
            console.log("[Delete] No rows deleted. Status:", shipmentId);
            return { error: 'No se pudo eliminar el envío. Es probable que ya haya sido pagado o procesado.' };
        }

        console.log('[Delete] Success via admin:', deletedData.length, 'rows');
    } catch (error: any) {
        console.error('[Database] Error deleting shipment:', error);
        return { error: 'No se pudo eliminar el envío.' };
    }

    revalidatePath('/dashboard');
    return { success: true };
}
