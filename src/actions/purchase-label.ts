'use server';

// ============================================================
// Server Action: Purchase Shipping Label
// Called after successful Stripe payment
// ============================================================

import { createServiceClient } from '@/lib/supabase/server';

export async function purchaseLabel(
    shipmentId: string,
    provider: string,
    rateId: string
): Promise<{ success: boolean; labelUrl?: string; error?: string }> {
    try {
        const supabase = await createServiceClient();

        // TODO: Call the actual carrier API to purchase the label
        // For now, simulate label generation
        const mockLabelUrl = `https://storage.example.com/labels/${shipmentId}.pdf`;

        // Update shipment record
        const { error } = await supabase
            .from('shipments')
            .update({
                status: 'label_created',
                label_url: mockLabelUrl,
                tracking_number: `WL${Date.now().toString(36).toUpperCase()}`,
                updated_at: new Date().toISOString(),
            })
            .eq('id', shipmentId);

        if (error) {
            throw error;
        }

        return { success: true, labelUrl: mockLabelUrl };
    } catch (error) {
        console.error('[purchaseLabel] Error:', error);
        return { success: false, error: 'No se pudo generar la etiqueta' };
    }
}
