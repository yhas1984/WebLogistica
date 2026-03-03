// ============================================================
// API Route: Tracking Lookup
// GET /api/tracking/[id]
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getTracking } from '@/lib/tracking';
import { createClient } from '@/lib/supabase/server';

function mapCarrierNameToSlug(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('correos')) return 'correos_espana';
    if (lowerName.includes('seur')) return 'seur';
    if (lowerName.includes('dhl')) return 'dhl_express';
    if (lowerName.includes('ups')) return 'ups';
    if (lowerName.includes('gls')) return 'gls';
    if (lowerName.includes('nacex')) return 'nacex';
    if (lowerName.includes('mrw')) return 'mrw';
    if (lowerName.includes('zeleris')) return 'zeleris';
    return lowerName.replace(/\s+/g, '_');
}

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
        const supabase = await createClient();

        // Find the shipment by tracking number
        const { data: shipment, error: dbError } = await supabase
            .from('shipments')
            .select('carrier_name, api_provider')
            .eq('tracking_number', trackingNumber)
            .single();

        let carrierSlug = 'dhl'; // Default fallback

        if (shipment && shipment.carrier_name) {
            carrierSlug = mapCarrierNameToSlug(shipment.carrier_name);
        } else {
            // Also we can check if there's any shipment using id just in case they typed the shipment UUID
            const { data: idShipment } = await supabase
                .from('shipments')
                .select('carrier_name, tracking_number')
                .eq('id', trackingNumber)
                .single();

            if (idShipment && idShipment.tracking_number) {
                carrierSlug = mapCarrierNameToSlug(idShipment.carrier_name);
                // We need to look up with the real tracking number if they used the internal ID
                const tracking = await getTracking(idShipment.tracking_number, carrierSlug);
                if (tracking) return NextResponse.json(tracking);
            }
        }

        const tracking = await getTracking(trackingNumber, carrierSlug);

        if (!tracking) {
            return NextResponse.json(
                { error: 'No pudimos encontrar información de este envío. Verifica que el número es correcto y vuelve a intentarlo más tarde.' },
                { status: 404 }
            );
        }

        return NextResponse.json(tracking);
    } catch (error) {
        console.error('[Tracking API] Error:', error);
        return NextResponse.json(
            { error: 'Ocurrió un error al procesar tu solicitud de rastreo' },
            { status: 500 }
        );
    }
}
