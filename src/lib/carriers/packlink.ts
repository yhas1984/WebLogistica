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

// ── Label Purchase ──────────────────────────────────────────
// 1. POST /v1/shipments — create the shipment order
// 2. GET /v1/shipments/{reference}/labels — retrieve PDFs
// ─────────────────────────────────────────────────────────────

export async function getPacklinkLabel(shipmentData: {
    id: string;
    rate_id: string;
    origin_data?: { postalCode?: string; countryCode?: string; city?: string; name?: string; address?: string; phone?: string; email?: string };
    destination_data?: { postalCode?: string; countryCode?: string; city?: string; name?: string; address?: string; phone?: string; email?: string };
    origin_postal_code?: string;
    origin_country?: string;
    destination_postal_code?: string;
    destination_country?: string;
    dimensions?: { weight?: number; length?: number; width?: number; height?: number };
    [key: string]: any;
}): Promise<{ tracking: string; pdf: string | null }> {
    const apiKey = process.env.PACKLINK_API_KEY;

    if (!apiKey) {
        throw new Error('[Packlink] No API key configured (PACKLINK_API_KEY)');
    }

    // Resolve fields from both DB formats
    const originZip = shipmentData.origin_postal_code || shipmentData.origin_data?.postalCode || '';
    const originCountry = shipmentData.origin_country || shipmentData.origin_data?.countryCode || 'ES';
    const originCity = shipmentData.origin_data?.city || 'Madrid';
    const destZip = shipmentData.destination_postal_code || shipmentData.destination_data?.postalCode || '';
    const destCountry = shipmentData.destination_country || shipmentData.destination_data?.countryCode || 'ES';
    const destCity = shipmentData.destination_data?.city || 'Madrid';

    const dimensions = shipmentData.dimensions || {};
    const weight = dimensions.weight || 1;
    const length = dimensions.length || 30;
    const width = dimensions.width || 20;
    const height = dimensions.height || 15;

    // Extract real Packlink service ID from our rate_id format: "packlink-{service_id}"
    const serviceId = shipmentData.rate_id?.replace('packlink-', '');

    if (!serviceId || !originZip || !destZip) {
        throw new Error(`[Packlink] Missing data: service=${serviceId}, from=${originZip}, to=${destZip}`);
    }

    console.log(`[Packlink] Creating shipment: ${originZip} → ${destZip}, service: ${serviceId}`);

    // Step 1: Create the shipment draft
    const createResponse = await fetch(`${PACKLINK_API_URL}/shipments`, {
        method: 'POST',
        headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: {
                country: originCountry,
                zip_code: originZip,
                city: originCity,
                name: shipmentData.origin_data?.name || 'Remitente',
                surname: 'WebLogistica',
                street: shipmentData.origin_data?.address || 'Calle Principal 1',
                phone: shipmentData.origin_data?.phone || '600000000',
                email: shipmentData.origin_data?.email || 'envios@weblogistica.com',
            },
            to: {
                country: destCountry,
                zip_code: destZip,
                city: destCity,
                name: shipmentData.destination_data?.name || 'Destinatario',
                surname: 'Cliente',
                street: shipmentData.destination_data?.address || 'Calle Destino 1',
                phone: shipmentData.destination_data?.phone || '600000001',
                email: shipmentData.destination_data?.email || 'cliente@example.com',
            },
            packages: [{
                width: width,
                height: height,
                length: length,
                weight: weight,
            }],
            service_id: parseInt(serviceId),
            content: 'Paquete',
            content_value: shipmentData.final_price || 10,
            shipment_custom_reference: shipmentData.id,
        }),
        signal: AbortSignal.timeout(20000),
    });

    if (!createResponse.ok) {
        const errText = await createResponse.text();
        console.error('[Packlink] Shipment creation failed:', createResponse.status, errText);
        throw new Error(`Packlink shipment creation failed: ${createResponse.status}`);
    }

    const shipmentResult = await createResponse.json();
    const shipmentRef = shipmentResult.reference || shipmentResult.shipment_custom_reference || shipmentData.id;
    const trackingNumber = shipmentResult.tracking_number || `PKL-${Date.now()}`;

    console.log(`[Packlink] Shipment created! Ref: ${shipmentRef}, Tracking: ${trackingNumber}`);

    // Step 2: Get the label PDF (may need a brief delay for processing)
    let labelPdf: string | null = null;

    try {
        // Wait a moment for label generation
        await new Promise(resolve => setTimeout(resolve, 2000));

        const labelResponse = await fetch(`${PACKLINK_API_URL}/shipments/${shipmentRef}/labels`, {
            headers: {
                'Authorization': apiKey,
            },
            signal: AbortSignal.timeout(15000),
        });

        if (labelResponse.ok) {
            const labelData = await labelResponse.json();
            // Packlink returns an array of label URLs
            labelPdf = Array.isArray(labelData) ? labelData[0] : (labelData.url || labelData.label_url || null);
            console.log(`[Packlink] Label retrieved: ${labelPdf}`);
        } else {
            console.warn(`[Packlink] Label not ready yet (${labelResponse.status}), tracking available.`);
        }
    } catch (labelErr) {
        console.warn('[Packlink] Could not retrieve label PDF immediately:', labelErr);
    }

    return {
        tracking: trackingNumber,
        pdf: labelPdf,
    };
}
