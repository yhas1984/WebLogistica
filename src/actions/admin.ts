'use server';

// ============================================================
// Admin Actions — Manual Payment Approval (Bizum/Transfer)
// Replicates the Stripe webhook flow but for manual payments
// ============================================================

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { purchaseLabel } from '@/actions/purchase-label';

/**
 * Approve a manual payment (Bizum, bank transfer, etc.)
 * - Verifies admin identity
 * - Updates shipment status to 'paid'
 * - Triggers label generation in background
 * - Revalidates the admin page
 */
export async function approveManualPayment(formData: FormData) {
    const shipmentId = formData.get('shipmentId') as string;

    if (!shipmentId) {
        throw new Error('Missing shipmentId');
    }

    // 1. Verify admin
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) redirect('/login');

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) {
        throw new Error('Unauthorized: Only admin can approve payments');
    }

    // 2. Use service client to bypass RLS
    const supabase = await createServiceClient();

    // 3. Verify shipment exists and is pending
    const { data: shipment, error: fetchError } = await supabase
        .from('shipments')
        .select('id, status')
        .eq('id', shipmentId)
        .single();

    if (fetchError || !shipment) {
        throw new Error(`Shipment not found: ${shipmentId}`);
    }

    if (shipment.status !== 'pending_payment') {
        // Already processed — just refresh
        revalidatePath('/admin');
        return;
    }

    // 4. Update to 'paid' (mark as manual payment)
    const { error: updateError } = await supabase
        .from('shipments')
        .update({
            status: 'paid',
            stripe_payment_id: `manual_${Date.now()}`, // Flag as manual
            updated_at: new Date().toISOString(),
        })
        .eq('id', shipmentId)
        .eq('status', 'pending_payment'); // Safety guard

    if (updateError) {
        console.error('[Admin] Error approving payment:', updateError);
        throw new Error('Error al aprobar el pago');
    }

    console.log(`[Admin] Payment approved for shipment ${shipmentId} by ${user.email}`);

    // 5. Trigger label generation in background (same as Stripe webhook)
    purchaseLabel(shipmentId).catch((error) => {
        console.error('[Admin] Background label purchase failed:', error);
    });

    // 6. Revalidate admin page
    revalidatePath('/admin');
}
