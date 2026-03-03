// ============================================================
// Genei v2 Carrier Adapter — PLACEHOLDER
// No public API documentation available.
// This adapter returns demo data and can be wired up once
// API docs/credentials are provided.
// ============================================================

import type { CarrierAdapter, CarrierRate, CarrierRateRequest } from './types';
import { getDemoRates } from './types';

const GENEI_API_URL = 'https://api.genei.es/v2';

interface GeneiQuote {
    id: number;
    carrier: { name: string };
    service: { name: string };
    price: number;
    currency: string;
    delivery_time: string;
}

export const geneiAdapter: CarrierAdapter = {
    provider: 'genei',

    async getRates(params: CarrierRateRequest): Promise<CarrierRate[]> {
        const apiKey = process.env.GENEI_API_KEY;

        if (!apiKey) {
            console.warn('[Genei] No API key configured');
            return [];
        }

        try {
            const response = await fetch(`${GENEI_API_URL}/rates`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    origin: {
                        zip: params.origin.postalCode,
                        country: params.origin.country,
                    },
                    destination: {
                        zip: params.destination.postalCode,
                        country: params.destination.country,
                    },
                    parcels: [
                        {
                            weight: params.parcel.billableWeight,
                            length: params.parcel.length,
                            width: params.parcel.width,
                            height: params.parcel.height,
                        },
                    ],
                }),
                signal: AbortSignal.timeout(15000),
            });

            if (!response.ok) {
                throw new Error(`Genei API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const quotes: GeneiQuote[] = data.quotes || [];

            return quotes.map((quote) => ({
                id: `genei-${quote.id}`,
                provider: 'genei' as const,
                carrierName: quote.carrier?.name || 'Genei Carrier',
                serviceName: quote.service?.name || 'Genei Service',
                estimatedDays: parseInt(quote.delivery_time) || 5,
                costPrice: quote.price,
                finalPrice: 0, // calculated by pricing engine
                currency: quote.currency || 'EUR',
            }));
        } catch (error) {
            console.error('[Genei] Rate fetch failed:', error);
            return [];
        }
    },
};
