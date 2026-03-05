// ============================================================
// API: Get Shipment Status (for checkout success polling)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Verify user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Fetch shipment — only for the authenticated user
        const { data: shipment, error } = await supabase
            .from('shipments')
            .select('status, tracking_number, label_url, carrier_name, service_name')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error || !shipment) {
            return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
        }

        return NextResponse.json(shipment);
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
