// ============================================================
// Shippo Carrier Adapter
// API: POST https://api.goshippo.com/shipments/
// Auth: ShippoToken <API_KEY>
// ============================================================

import type { CarrierAdapter, CarrierRate, CarrierRateRequest } from './types';
import { getDemoRates } from './types';

const SHIPPO_API_URL = 'https://api.goshippo.com';

interface ShippoRate {
    object_id: string;
    provider: string;
    servicelevel: { name: string; token: string };
    amount: string;
    currency: string;
    estimated_days: number;
    duration_terms: string;
}

interface ShippoShipmentResponse {
    rates: ShippoRate[];
}

export const shippoAdapter: CarrierAdapter = {
    provider: 'shippo',

    async getRates(params: CarrierRateRequest): Promise<CarrierRate[]> {
        const apiKey = process.env.SHIPPO_API_KEY;

        // Demo mode fallback — Disabled to show real data only per user request
        if (!apiKey) {
            console.warn('[Shippo] No API key configured');
            return [];
        }

        try {
            const response = await fetch(`${SHIPPO_API_URL}/shipments/`, {
                method: 'POST',
                headers: {
                    'Authorization': `ShippoToken ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address_from: {
                        zip: params.origin.postalCode,
                        country: params.origin.country,
                    },
                    address_to: {
                        zip: params.destination.postalCode,
                        country: params.destination.country,
                    },
                    parcels: [
                        {
                            length: String(params.parcel.length),
                            width: String(params.parcel.width),
                            height: String(params.parcel.height),
                            weight: String(params.parcel.billableWeight),
                            distance_unit: 'cm',
                            mass_unit: 'kg',
                        },
                    ],
                    async: false,
                }),
                signal: AbortSignal.timeout(15000), // 15s timeout
            });

            if (!response.ok) {
                throw new Error(`Shippo API error: ${response.status} ${response.statusText}`);
            }

            const data: ShippoShipmentResponse = await response.json();

            return data.rates.map((rate) => ({
                id: `shippo-${rate.object_id}`,
                provider: 'shippo' as const,
                carrierName: rate.provider,
                serviceName: rate.servicelevel.name,
                serviceType: 'door_to_door', // shippo uses door to door usually
                estimatedDays: rate.estimated_days || 5,
                costPrice: parseFloat(rate.amount),
                finalPrice: 0, // calculated by pricing engine
                currency: rate.currency === 'USD' ? 'EUR' : rate.currency, // normalize
            }));
        } catch (error) {
            console.error('[Shippo] Rate fetch failed:', error);
            return [];
        }
    },
};

// ── Label Purchase ──────────────────────────────────────────
// POST https://api.goshippo.com/transactions/
// Uses the rate object_id from the rates response to purchase a real label
// ─────────────────────────────────────────────────────────────

interface ShippoTransaction {
    object_id: string;
    status: 'SUCCESS' | 'QUEUED' | 'ERROR';
    tracking_number: string;
    tracking_url_provider: string;
    label_url: string;
    eta: string;
    messages: Array<{ text: string }>;
}

export async function getShippoLabel(shipmentData: {
    rate_id: string;
    id: string;
    [key: string]: any;
}): Promise<{ tracking: string; pdf: string | null }> {
    const apiKey = process.env.SHIPPO_API_KEY;

    if (!apiKey) {
        throw new Error('[Shippo] No API key configured (SHIPPO_API_KEY)');
    }

    // Extract the real Shippo rate object_id from our stored rate_id format: "shippo-{object_id}"
    const rateObjectId = shipmentData.rate_id?.replace('shippo-', '');

    if (!rateObjectId) {
        throw new Error(`[Shippo] Invalid rate_id: ${shipmentData.rate_id}`);
    }

    console.log(`[Shippo] Purchasing label for rate ${rateObjectId}, shipment ${shipmentData.id}`);

    const response = await fetch(`${SHIPPO_API_URL}/transactions/`, {
        method: 'POST',
        headers: {
            'Authorization': `ShippoToken ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            rate: rateObjectId,
            label_file_type: 'PDF',
            async: false,
        }),
        signal: AbortSignal.timeout(30000), // 30s — label purchase can be slow
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('[Shippo] Label purchase HTTP error:', response.status, errText);
        throw new Error(`Shippo label purchase failed: ${response.status}`);
    }

    const transaction: ShippoTransaction = await response.json();

    if (transaction.status === 'ERROR') {
        const errorMsg = transaction.messages?.map(m => m.text).join(', ') || 'Unknown error';
        console.error('[Shippo] Transaction error:', errorMsg);
        throw new Error(`Shippo transaction error: ${errorMsg}`);
    }

    console.log(`[Shippo] Label purchased! Tracking: ${transaction.tracking_number}, URL: ${transaction.label_url}`);

    return {
        tracking: transaction.tracking_number || `SHP-${Date.now()}`,
        pdf: transaction.label_url || null,
    };
}
