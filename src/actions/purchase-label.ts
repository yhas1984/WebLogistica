'use server';

// ============================================================
// Server Action: Purchase Shipping Label
// Called after successful Stripe payment
// ============================================================

import { createServiceClient } from '@/lib/supabase/server';
import { getGeneiLabel } from '@/lib/carriers/genei';
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

        // 2. Comprar según provider con Alerta de Seguridad (Try-Catch robusto)
        try {
            if (shipment.provider === 'genei') {
                const result = await getGeneiLabel(shipment);
                if (result.tracking) tracking = result.tracking;

                if (result.pdf) {
                    // 3. Resiliencia: Almacenamiento de Etiquetas en Storage (Supabase)
                    try {
                        const pdfResponse = await fetch(result.pdf);
                        if (!pdfResponse.ok) throw new Error('Could not fetch PDF from Genei');
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

                        // Retrieve the permanent URL from the bucket
                        const { data: publicUrlData } = supabase.storage
                            .from('shipping_labels')
                            .getPublicUrl(fileName);

                        labelUrl = publicUrlData.publicUrl;
                    } catch (uploadObjError) {
                        console.error('[purchaseLabel] Error uploading to Supabase, falling back to Carrier URL', uploadObjError);
                        labelUrl = result.pdf;
                    }
                }
            }
        } catch (labelError) {
            console.error('[purchaseLabel] Failed to generate/fetch label from Carrier:', labelError);
            // Fallback status to manual intervention if label fails but money was paid
            await supabase.from('shipments')
                .update({ status: 'manual_intervention_required', updated_at: new Date().toISOString() })
                .eq('id', shipmentId);

            throw new Error('Generación de etiqueta fallida, requiere intervención manual.');
        }

        // Update shipment record
        const { error: updateError } = await supabase
            .from('shipments')
            .update({
                status: 'labels_generated', // Status indicating completion of label generation
                label_url: labelUrl,
                tracking_number: tracking,
                updated_at: new Date().toISOString(),
            })
            .eq('id', shipmentId);

        if (updateError) {
            throw updateError;
        }

        // 4. Send Confirmation Email via Resend
        try {
            if (shipment.user_id) {
                const { data: userData, error: userError } = await supabase.auth.admin.getUserById(shipment.user_id);
                if (!userError && userData?.user?.email) {
                    await sendLabelEmail({
                        to: userData.user.email,
                        trackingNumber: tracking,
                        labelUrl: labelUrl,
                        shipmentId: shipmentId
                    });
                }
            }
        } catch (emailError) {
            console.error('[purchaseLabel] Error sending confirmation email:', emailError);
            // Non-critical, do not fail label generation
        }

        return { success: true, labelUrl };
    } catch (error) {
        console.error('[purchaseLabel] Error:', error);
        return { success: false, error: 'No se pudo generar la etiqueta' };
    }
}
