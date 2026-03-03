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
