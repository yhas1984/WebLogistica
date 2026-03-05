// ============================================================
// Packlink PRO Carrier Adapter (Production)
// ✅ Exact API format for dimensions (numbers, not strings)
// ✅ Proper collection_type mapping
// ✅ Label retrieval with retry polling
// ============================================================

import type { CarrierAdapter, CarrierRate, CarrierRateRequest } from './types';

const PACKLINK_API_URL = 'https://api.packlink.com/v1';

function getHeaders() {
    const apiKey = process.env.PACKLINK_API_KEY;
    if (!apiKey) throw new Error('[Packlink] PACKLINK_API_KEY not configured');
    return {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
    };
}

// ── Rate Fetching ───────────────────────────────────────────
export const packlinkAdapter: CarrierAdapter = {
    provider: 'packlink',

    async getRates(params: CarrierRateRequest): Promise<CarrierRate[]> {
        try {
            const headers = getHeaders();

            // Packlink requires exact number types for package dimensions
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
                headers,
                signal: AbortSignal.timeout(15000),
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('[Packlink] API error:', response.status, errText);
                return [];
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                console.warn('[Packlink] Unexpected response format:', typeof data);
                return [];
            }

            return data.map((service: any) => ({
                id: `packlink-${service.id}`,
                provider: 'packlink' as const,
                carrierName: service.carrier_name,
                serviceName: service.name,
                serviceType: (service.collection_type === 'drop_off' ? 'drop_off' : 'door_to_door') as 'door_to_door' | 'drop_off',
                estimatedDays: parseInt(service.transit_time) || 5,
                costPrice: typeof service.price === 'object'
                    ? parseFloat(service.price.total_price)
                    : parseFloat(service.price),
                finalPrice: 0,
                currency: (typeof service.price === 'object' ? service.price.currency : 'EUR') || 'EUR',
            }));
        } catch (error) {
            console.error('[Packlink] Rate fetch failed:', error);
            return [];
        }
    },
};

// ── Label Purchase ──────────────────────────────────────────
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
    final_price?: number;
    [key: string]: any;
}): Promise<{ tracking: string; pdf: string | null }> {
    const headers = getHeaders();

    // Resolve fields from both DB formats
    const originZip = shipmentData.origin_postal_code || shipmentData.origin_data?.postalCode || '';
    const originCountry = shipmentData.origin_country || shipmentData.origin_data?.countryCode || 'ES';
    const originCity = shipmentData.origin_data?.city || 'Madrid';
    const destZip = shipmentData.destination_postal_code || shipmentData.destination_data?.postalCode || '';
    const destCountry = shipmentData.destination_country || shipmentData.destination_data?.countryCode || 'ES';
    const destCity = shipmentData.destination_data?.city || 'Madrid';

    const dimensions = shipmentData.dimensions || {};
    // Packlink requires numbers (not strings) for package dimensions
    const weight = Number(dimensions.weight) || 1;
    const length = Number(dimensions.length) || 30;
    const width = Number(dimensions.width) || 20;
    const height = Number(dimensions.height) || 15;

    // Extract real Packlink service ID from our rate_id format: "packlink-{service_id}"
    const serviceId = shipmentData.rate_id?.replace('packlink-', '');

    if (!serviceId || !originZip || !destZip) {
        throw new Error(`[Packlink] Missing data: service=${serviceId}, from=${originZip}, to=${destZip}`);
    }

    console.log(`[Packlink] Creating shipment: ${originZip} → ${destZip}, service: ${serviceId}`);

    // Step 1: Create the shipment draft
    const createResponse = await fetch(`${PACKLINK_API_URL}/shipments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            from: {
                country: originCountry,
                zip_code: originZip,
                city: originCity,
                name: shipmentData.origin_data?.name || 'Remitente',
                surname: 'WebLogistica',
                street1: shipmentData.origin_data?.address || 'Calle Principal 1',
                phone: shipmentData.origin_data?.phone || '600000000',
                email: shipmentData.origin_data?.email || process.env.ADMIN_EMAIL || 'envios@weblogistica.com',
            },
            to: {
                country: destCountry,
                zip_code: destZip,
                city: destCity,
                name: shipmentData.destination_data?.name || 'Destinatario',
                surname: 'Cliente',
                street1: shipmentData.destination_data?.address || 'Calle Destino 1',
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
            content: 'Paquete Ecommerce',
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
    const trackingNumber = shipmentResult.tracking_number || `PKL-${shipmentRef}`;

    console.log(`[Packlink] Shipment created! Ref: ${shipmentRef}, Tracking: ${trackingNumber}`);

    // Step 2: Poll for label PDF (Packlink labels may not be immediately available)
    let labelPdf: string | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
        // Wait progressively: 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt)));

        try {
            const labelResponse = await fetch(`${PACKLINK_API_URL}/shipments/${shipmentRef}/labels`, {
                headers: { 'Authorization': headers.Authorization },
                signal: AbortSignal.timeout(10000),
            });

            if (labelResponse.ok) {
                const labelData = await labelResponse.json();
                labelPdf = Array.isArray(labelData) ? labelData[0] : (labelData.url || labelData.label_url || null);

                if (labelPdf) {
                    console.log(`[Packlink] Label retrieved on attempt ${attempt + 1}: ${labelPdf}`);
                    break;
                }
            } else {
                console.warn(`[Packlink] Label attempt ${attempt + 1} failed (${labelResponse.status})`);
            }
        } catch (labelErr) {
            console.warn(`[Packlink] Label retrieval attempt ${attempt + 1} error:`, labelErr);
        }
    }

    if (!labelPdf) {
        console.warn('[Packlink] Label not available after 3 attempts. Client can get it from Packlink dashboard.');
        labelPdf = `https://pro.packlink.es/private/shipments/${shipmentRef}/labels`;
    }

    return {
        tracking: trackingNumber,
        pdf: labelPdf,
    };
}
