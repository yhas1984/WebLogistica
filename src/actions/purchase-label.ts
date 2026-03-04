'use server';

// ============================================================
// Server Action: Purchase Shipping Label
// Called after successful Stripe payment or manual admin approval
// Supports: Genei, Shippo (UPS, FedEx, DHL, SEUR, etc.)
// ============================================================

import { createServiceClient } from '@/lib/supabase/server';
import { getGeneiLabel } from '@/lib/carriers/genei';
import { getShippoLabel } from '@/lib/carriers/shippo';
import { sendLabelEmail } from '@/lib/resend';

export async function purchaseLabel(
    shipmentId: string
): Promise<{ success: boolean; labelUrl?: string; error?: string }> {
    try {
        const supabase = await createServiceClient();

        // 1. Obtener los datos del envío
        const { data: shipment, error: fetchError } = await supabase
            .from('shipments')
            .select('*')
            .eq('id', shipmentId)
            .single();

        if (fetchError || !shipment) {
            throw new Error(`[purchaseLabel] Shipment not found: ${shipmentId}`);
        }

        let tracking = `WL${Date.now().toString(36).toUpperCase()}`;
        let labelUrl = '';

        // 2. Comprar etiqueta según el provider
        try {
            const provider = shipment.api_provider;
            console.log(`[purchaseLabel] Provider: ${provider}, shipment: ${shipmentId}`);

            if (provider === 'genei') {
                // ── Genei ─────────────────────────────────────
                const result = await getGeneiLabel(shipment);
                if (result.tracking) tracking = result.tracking;
                if (result.pdf) {
                    labelUrl = await uploadLabelToStorage(supabase, shipmentId, result.pdf);
                }

            } else if (provider === 'shippo') {
                // ── Shippo (UPS, FedEx, DHL, SEUR, etc.) ─────
                const result = await getShippoLabel(shipment);
                if (result.tracking) tracking = result.tracking;
                if (result.pdf) {
                    labelUrl = await uploadLabelToStorage(supabase, shipmentId, result.pdf);
                }

            } else if (provider === 'packlink') {
                // ── Packlink — TODO: integrar compra de labels ──
                console.warn(`[purchaseLabel] Packlink label purchase not yet implemented. Shipment: ${shipmentId}`);
                // Por ahora deja tracking genérico y sin PDF

            } else {
                console.warn(`[purchaseLabel] Unknown provider "${provider}" for shipment ${shipmentId}`);
            }

        } catch (labelError) {
            console.error('[purchaseLabel] Failed to generate/fetch label from Carrier:', labelError);
            // Fallback: marcar como intervención manual si la etiqueta falla pero el dinero se cobró
            await supabase.from('shipments')
                .update({ status: 'manual_intervention_required', updated_at: new Date().toISOString() })
                .eq('id', shipmentId);

            throw new Error('Generación de etiqueta fallida, requiere intervención manual.');
        }

        // 3. Actualizar envío con tracking y label
        const { error: updateError } = await supabase
            .from('shipments')
            .update({
                status: 'labels_generated',
                label_url: labelUrl,
                tracking_number: tracking,
                updated_at: new Date().toISOString(),
            })
            .eq('id', shipmentId);

        if (updateError) {
            throw updateError;
        }

        console.log(`[purchaseLabel] Success! Tracking: ${tracking}, Label: ${labelUrl}`);

        // 4. Enviar email de confirmación via Resend
        try {
            if (shipment.user_id) {
                const { data: userData, error: userError } = await supabase.auth.admin.getUserById(shipment.user_id);
                if (!userError && userData?.user?.email) {
                    await sendLabelEmail({
                        to: userData.user.email,
                        customerName: shipment.origin_data?.name || userData.user.user_metadata?.full_name || 'Cliente',
                        originCity: shipment.origin_data?.city || 'Origen',
                        destCity: shipment.destination_data?.city || 'Destino',
                        trackingNumber: tracking,
                        labelUrl: labelUrl,
                        carrierName: shipment.carrier_name || 'Carrier'
                    });
                }
            }
        } catch (emailError) {
            console.error('[purchaseLabel] Error sending confirmation email:', emailError);
            // No-critical, no falla la generación de etiqueta
        }

        return { success: true, labelUrl };
    } catch (error) {
        console.error('[purchaseLabel] Error:', error);
        return { success: false, error: 'No se pudo generar la etiqueta' };
    }
}

// ── Helper: Upload label PDF to Supabase Storage ────────────
async function uploadLabelToStorage(
    supabase: Awaited<ReturnType<typeof createServiceClient>>,
    shipmentId: string,
    pdfUrl: string
): Promise<string> {
    try {
        const pdfResponse = await fetch(pdfUrl);
        if (!pdfResponse.ok) throw new Error(`Could not fetch PDF: ${pdfResponse.status}`);
        const arrayBuffer = await pdfResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const fileName = `${shipmentId}_${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
            .from('shipping_labels')
            .upload(fileName, buffer, {
                contentType: 'application/pdf',
                upsert: true,
            });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
            .from('shipping_labels')
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
    } catch (uploadError) {
        console.error('[purchaseLabel] Error uploading to Supabase Storage, using carrier URL:', uploadError);
        return pdfUrl; // Fallback: usar la URL original del carrier
    }
}
