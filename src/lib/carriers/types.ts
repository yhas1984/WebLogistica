// ============================================================
// Carrier Types — Shared interface for all carrier adapters
// ============================================================

import type { CarrierAdapter, CarrierRate, CarrierProvider, ParcelWithVolumetric } from '@/types';

export type { CarrierAdapter, CarrierRate, CarrierProvider, ParcelWithVolumetric };

export interface CarrierRateRequest {
    origin: { postalCode: string; city: string; country: string };
    destination: { postalCode: string; city: string; country: string };
    parcel: ParcelWithVolumetric;
}

// Demo rates for when API keys are not configured
export function getDemoRates(provider: CarrierProvider, parcel: ParcelWithVolumetric): CarrierRate[] {
    const basePrice = parcel.billableWeight * 2.5;

    const demoData: Record<CarrierProvider, CarrierRate[]> = {
        shippo: [
            {
                id: `demo-shippo-express-${Date.now()}`,
                provider: 'shippo',
                carrierName: 'DHL Express',
                serviceName: 'Express Domestic',
                serviceType: 'door_to_door',
                estimatedDays: 1,
                costPrice: basePrice * 1.8,
                finalPrice: 0, // will be calculated by pricing engine
                currency: 'EUR',
            },
            {
                id: `demo-shippo-standard-${Date.now()}`,
                provider: 'shippo',
                carrierName: 'SEUR',
                serviceName: 'Standard',
                serviceType: 'door_to_door',
                estimatedDays: 3,
                costPrice: basePrice * 1.0,
                finalPrice: 0,
                currency: 'EUR',
            },
            {
                id: `demo-shippo-economy-${Date.now()}`,
                provider: 'shippo',
                carrierName: 'Correos',
                serviceName: 'Paq Standard',
                serviceType: 'drop_off',
                estimatedDays: 5,
                costPrice: basePrice * 0.7,
                finalPrice: 0,
                currency: 'EUR',
            },
        ],
        packlink: [
            {
                id: `demo-packlink-express-${Date.now()}`,
                provider: 'packlink',
                carrierName: 'UPS',
                serviceName: 'Express Saver',
                serviceType: 'door_to_door',
                estimatedDays: 2,
                costPrice: basePrice * 1.5,
                finalPrice: 0,
                currency: 'EUR',
            },
            {
                id: `demo-packlink-standard-${Date.now()}`,
                provider: 'packlink',
                carrierName: 'GLS',
                serviceName: 'Business Parcel',
                serviceType: 'drop_off',
                estimatedDays: 4,
                costPrice: basePrice * 0.9,
                finalPrice: 0,
                currency: 'EUR',
            },
        ],
        genei: [
            {
                id: `demo-genei-express-${Date.now()}`,
                provider: 'genei',
                carrierName: 'FedEx',
                serviceName: 'International Priority',
                serviceType: 'door_to_door',
                estimatedDays: 2,
                costPrice: basePrice * 1.6,
                finalPrice: 0,
                currency: 'EUR',
            },
            {
                id: `demo-genei-economy-${Date.now()}`,
                provider: 'genei',
                carrierName: 'MRW',
                serviceName: 'Nacional',
                serviceType: 'door_to_door',
                estimatedDays: 3,
                costPrice: basePrice * 0.85,
                finalPrice: 0,
                currency: 'EUR',
            },
        ],
    };

    return demoData[provider] || [];
}
