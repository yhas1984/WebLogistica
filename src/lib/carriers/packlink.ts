// ============================================================
// Packlink PRO Carrier Adapter
// API: POST https://apisandbox.packlink.com/v1/services
// Auth: Authorization: <API_KEY>
// ============================================================

import type { CarrierAdapter, CarrierRate, CarrierRateRequest } from './types';
import { getDemoRates } from './types';

const PACKLINK_API_URL = 'https://api.packlink.com/v1';

interface PacklinkService {
    id: number;
    carrier_name: string;
    name: string;
    price: { total_price: number; currency: string };
    transit_time: string; // e.g., "1 DAYS"
}

export const packlinkAdapter: CarrierAdapter = {
    provider: 'packlink',

    async getRates(params: CarrierRateRequest): Promise<CarrierRate[]> {
        const apiKey = process.env.PACKLINK_API_KEY;

        if (!apiKey) {
            console.warn('[Packlink] No API key configured');
            return [];
        }

        try {
            const queryParams = new URLSearchParams({
                'from[zip]': params.origin.postalCode,
                'from[country]': params.origin.country,
                'to[zip]': params.destination.postalCode,
                'to[country]': params.destination.country,
                'packages[0][weight]': String(params.parcel.billableWeight),
                'packages[0][length]': String(params.parcel.length),
                'packages[0][width]': String(params.parcel.width),
                'packages[0][height]': String(params.parcel.height),
            });

            const response = await fetch(`${PACKLINK_API_URL}/services?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': apiKey,
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(15000),
            });

            if (!response.ok) {
                throw new Error(`Packlink API error: ${response.status} ${response.statusText}`);
            }

            const data: PacklinkService[] = await response.json();

            return data.map((service) => ({
                id: `packlink-${service.id}`,
                provider: 'packlink' as const,
                carrierName: service.carrier_name,
                serviceName: service.name,
                serviceType: 'drop_off', // Default packlink type mapped based on type
                estimatedDays: parseInt(service.transit_time) || 5, // parses "1 DAYS" into 1
                costPrice: service.price.total_price,
                finalPrice: 0,
                currency: service.price.currency || 'EUR',
            }));
        } catch (error) {
            console.error('[Packlink] Rate fetch failed:', error);
            return [];
        }
    },
};
