// ============================================================
// API Route: Tracking Lookup
// GET /api/tracking/[id]
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getTracking } from '@/lib/tracking';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: trackingNumber } = await params;

    if (!trackingNumber) {
        return NextResponse.json(
            { error: 'Tracking number is required' },
            { status: 400 }
        );
    }

    try {
        // Try to detect carrier — in production, this would come from the shipment record
        const tracking = await getTracking(trackingNumber, 'dhl');

        if (!tracking) {
            return NextResponse.json(
                { error: 'Tracking not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(tracking);
    } catch (error) {
        console.error('[Tracking API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
