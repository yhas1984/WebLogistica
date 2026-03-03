// ============================================================
// Logistics Orchestrator — Core Rate Comparison Engine
// ============================================================
// 1. Calculates volumetric weight (Small Box Penalty)
// 2. Fetches rates from all carriers in parallel
// 3. Applies dynamic pricing
// 4. Returns sorted, normalized results
// ============================================================

import type {
    QuoteRequest,
    ParcelWithVolumetric,
    CarrierRate,
    RateResultsData,
} from '@/types';
import { shippoAdapter } from '@/lib/carriers/shippo';
import { packlinkAdapter } from '@/lib/carriers/packlink';
import { geneiAdapter } from '@/lib/carriers/genei';
import { applyPricingToRates } from '@/lib/pricing';
import type { CarrierAdapter, CarrierRateRequest } from '@/lib/carriers/types';

// All registered carrier adapters
const carriers: CarrierAdapter[] = [
    shippoAdapter,
    packlinkAdapter,
    geneiAdapter,
];

/**
 * Calculate volumetric weight using the industry-standard formula.
 * "Small Box Penalty": always use the greater of real vs volumetric weight.
 */
export function calculateVolumetricWeight(
    length: number,
    width: number,
    height: number
): number {
    return (length * width * height) / 5000;
}

/**
 * Create a ParcelWithVolumetric from raw dimensions.
 */
export function createParcel(
    weight: number,
    length: number,
    width: number,
    height: number
): ParcelWithVolumetric {
    const volumetricWeight = calculateVolumetricWeight(length, width, height);
    const billableWeight = Math.max(weight, volumetricWeight);

    return {
        weight,
        length,
        width,
        height,
        volumetricWeight: Math.round(volumetricWeight * 100) / 100,
        billableWeight: Math.round(billableWeight * 100) / 100,
    };
}

/**
 * Fetch optimized rates from all carriers.
 * Uses Promise.allSettled for resilience — failed carriers are logged but don't break the flow.
 */
export async function getOptimizedRates(
    request: QuoteRequest,
    subdomainMarkup: number = 0
): Promise<RateResultsData> {
    // 1. Calculate parcel with volumetric weight
    const parcel = createParcel(
        request.weight,
        request.length,
        request.width,
        request.height
    );

    // 2. Build the carrier request
    const carrierRequest: CarrierRateRequest = {
        origin: {
            postalCode: request.originPostalCode,
            city: request.originCity,
            country: request.originCountry,
        },
        destination: {
            postalCode: request.destinationPostalCode,
            city: request.destinationCity,
            country: request.destinationCountry,
        },
        parcel,
    };

    // 3. Fetch rates from all carriers in parallel
    const results = await Promise.allSettled(
        carriers.map((carrier) => carrier.getRates(carrierRequest))
    );

    // 4. Collect successful rates and errors
    const allRates: CarrierRate[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
        const carrierName = carriers[index].provider;
        if (result.status === 'fulfilled') {
            console.log(`[Orchestrator] ${carrierName} returned ${result.value.length} rates`);
            allRates.push(...result.value);
        } else {
            errors.push(`${carrierName}: ${result.reason?.message || 'Unknown error'}`);
            console.error(`[Orchestrator] ${carrierName} failed:`, result.reason);
        }
    });

    // 5. Apply dynamic pricing (markup + Stripe fees)
    // Here we respect the subdomains markup percentage from db
    const pricedRates = applyPricingToRates(allRates, {
        percentage: subdomainMarkup,
        fixedFee: 0.50
    });

    // 6. Sort by final price (cheapest first)
    pricedRates.sort((a, b) => a.finalPrice - b.finalPrice);

    // 7. Find cheapest and fastest
    const cheapest = pricedRates.length > 0 ? pricedRates[0] : undefined;
    const fastest = pricedRates.length > 0
        ? pricedRates.reduce((min, r) => r.estimatedDays < min.estimatedDays ? r : min)
        : undefined;

    return {
        rates: pricedRates,
        cheapest,
        fastest,
        parcel,
        errors,
        searchParams: carrierRequest,
    };
}
