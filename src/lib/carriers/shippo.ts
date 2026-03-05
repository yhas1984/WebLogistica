// ============================================================
// Shippo Carrier Adapter (Production)
// ✅ Customs declarations for international shipments
// ✅ Full address fields for label generation
// ============================================================

import type { CarrierAdapter, CarrierRate, CarrierRateRequest } from './types';

const SHIPPO_API_URL = 'https://api.goshippo.com';

function getHeaders() {
    const apiKey = process.env.SHIPPO_API_KEY;
    if (!apiKey) throw new Error('[Shippo] SHIPPO_API_KEY not configured');
    return {
        'Authorization': `ShippoToken ${apiKey}`,
        'Content-Type': 'application/json',
    };
}

// ── Rate Fetching ───────────────────────────────────────────
export const shippoAdapter: CarrierAdapter = {
    provider: 'shippo',

    async getRates(params: CarrierRateRequest): Promise<CarrierRate[]> {
        try {
            const headers = getHeaders();
            const isInternational = params.origin.country !== params.destination.country;

            // ── Crear Shipment para obtener tarifas ─────────────
            const payload: Record<string, any> = {
                address_from: {
                    name: "Remitente",
                    street1: "Dirección origen",
                    city: params.origin.city,
                    zip: params.origin.postalCode,
                    country: params.origin.country,
                    phone: "000000000",
                    email: "noreply@weblogistica.com",
                },
                address_to: {
                    name: "Destinatario",
                    street1: "Dirección destino",
                    city: params.destination.city,
                    zip: params.destination.postalCode,
                    country: params.destination.country,
                    phone: "000000000",
                    email: "noreply@weblogistica.com",
                },
                parcels: [{
                    length: String(params.parcel.length),
                    width: String(params.parcel.width),
                    height: String(params.parcel.height),
                    weight: String(params.parcel.billableWeight),
                    distance_unit: 'cm',
                    mass_unit: 'kg',
                }],
                async: false,
            };

            // ── Aduanas integradas para envíos internacionales ─────────────
            if (isInternational) {
                payload.customs_declaration = {
                    certify: true,
                    certifier: "WebLogistica System",
                    items: [{
                        description: "General Merchandise",
                        quantity: 1,
                        net_weight: String(params.parcel.billableWeight),
                        mass_unit: "kg",
                        value_amount: "50.00",
                        value_currency: "EUR",
                        origin_country: params.origin.country
                    }],
                    non_delivery_option: "RETURN",
                    contents_type: "MERCHANDISE"
                };
            }

            const response = await fetch(`${SHIPPO_API_URL}/shipments/`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(15000),
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('[Shippo] Shipment creation failed:', response.status, errText);
                return [];
            }

            const data = await response.json();

            if (!data.rates || data.rates.length === 0) {
                console.warn('[Shippo] No rates returned for this route');
                return [];
            }

            return data.rates.map((rate: any) => ({
                id: `shippo-${rate.object_id}`,
                provider: 'shippo' as const,
                carrierName: rate.provider,
                serviceName: rate.servicelevel.name,
                serviceType: 'door_to_door' as const,
                estimatedDays: rate.estimated_days || 5,
                costPrice: parseFloat(rate.amount),
                finalPrice: 0,
                currency: rate.currency === 'USD' ? 'EUR' : rate.currency,
            }));
        } catch (error) {
            console.error('[Shippo] Rate fetch failed:', error);
            return [];
        }
    },
};

// ── Label Purchase ──────────────────────────────────────────
interface ShippoTransaction {
    object_id: string;
    status: 'SUCCESS' | 'QUEUED' | 'ERROR';
    tracking_number: string;
    tracking_url_provider: string;
    label_url: string;
    messages: Array<{ text: string }>;
}

export async function getShippoLabel(shipmentData: {
    rate_id: string;
    id: string;
    [key: string]: any;
}): Promise<{ tracking: string; pdf: string | null }> {
    const headers = getHeaders();

    // Extract the real Shippo rate object_id from our stored rate_id format: "shippo-{object_id}"
    const rateObjectId = shipmentData.rate_id?.replace('shippo-', '');

    if (!rateObjectId) {
        throw new Error(`[Shippo] Invalid rate_id: ${shipmentData.rate_id}`);
    }

    console.log(`[Shippo] Purchasing label for rate ${rateObjectId}, shipment ${shipmentData.id}`);

    const response = await fetch(`${SHIPPO_API_URL}/transactions/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            rate: rateObjectId,
            label_file_type: 'PDF',
            async: false,
        }),
        signal: AbortSignal.timeout(30000),
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
