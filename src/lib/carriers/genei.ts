// ============================================================
// Genei v2 Carrier Adapter
// Handles Bearer Token Auth logic extending for 15 days
// and provides real API requests to v2 endpoints.
// ============================================================

import type { CarrierAdapter, CarrierRate, CarrierRateRequest } from './types';
import { getDemoRates } from './types';

const GENEI_API_URL = 'https://apiv2.genei.es/api/v2';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getGeneiToken() {
    if (cachedToken && Date.now() < tokenExpiresAt) {
        return cachedToken;
    }

    const token = process.env.GENEI_API_KEY;

    if (!token) {
        throw new Error("[Genei] API key missing from environment variables (GENEI_API_KEY)");
    }

    cachedToken = token;
    // Assume token is long-lived if provided via env, but set an arbitrary 1-day local cache timeout
    tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

    return cachedToken;
}

export const geneiAdapter: CarrierAdapter = {
    provider: 'genei',

    async getRates(params: CarrierRateRequest): Promise<CarrierRate[]> {
        try {
            const token = await getGeneiToken();

            const response = await fetch(`${GENEI_API_URL}/agencies/prices`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    cp_recogida: params.origin.postalCode,
                    pais_recogida: params.origin.country,
                    cp_entrega: params.destination.postalCode,
                    pais_entrega: params.destination.country,
                    bultos: [{
                        peso: params.parcel.billableWeight,
                        largo: params.parcel.length,
                        ancho: params.parcel.width,
                        alto: params.parcel.height
                    }]
                }),
                signal: AbortSignal.timeout(8000), // Reduce timeout to 8s so users don't wait forever
            });

            if (!response.ok) {
                console.error("[Genei] HTTP error:", response.status, response.statusText);
                const errText = await response.text();
                console.error("[Genei] HTTP error text:", errText);
                return getDemoRates('genei', params.parcel);
            }

            const data = await response.json();

            // Mapeo de la respuesta de Genei a nuestro formato estándar
            const result = (Array.isArray(data) ? data : []).map((agency: any) => ({
                id: `genei-${agency.id}`,
                provider: 'genei' as const,
                carrierName: agency.nombre || 'Genei Carrier',
                serviceName: agency.nombre_servicio || 'Genei Service',
                serviceType: 'door_to_door' as 'door_to_door' | 'drop_off', // Default for now
                estimatedDays: parseInt(agency.plazo_entregas) || 5,
                costPrice: parseFloat(agency.total),
                finalPrice: 0, // se calcula en el orquestador
                currency: 'EUR',
            }));

            // Si Genei responde con un JSON válido pero 0 agencias, devolvemos demo fallback
            if (result.length === 0) {
                console.warn("[Genei] Returned 0 rates. Falling back to demo data.");
                return getDemoRates('genei', params.parcel);
            }

            return result;
        } catch (error) {
            console.error("[Genei] API Error/Timeout. Falling back to demo rates.", error);
            return getDemoRates('genei', params.parcel);
        }
    },
};

export async function getGeneiLabel(shipmentData: any) {
    const token = await getGeneiToken();

    // Support both DB column formats: direct columns OR nested in origin_data/destination_data
    const originPostalCode = shipmentData.origin_postal_code || shipmentData.origin_data?.postalCode;
    const originCountry = shipmentData.origin_country || shipmentData.origin_data?.countryCode || 'ES';
    const destPostalCode = shipmentData.destination_postal_code || shipmentData.destination_data?.postalCode;
    const destCountry = shipmentData.destination_country || shipmentData.destination_data?.countryCode || 'ES';

    if (!originPostalCode || !destPostalCode) {
        throw new Error(`[Genei] Missing postal codes: origin=${originPostalCode}, dest=${destPostalCode}`);
    }

    // Extract dimensions from shipment
    const dimensions = shipmentData.dimensions || {};
    const weight = dimensions.weight || shipmentData.weight || 1;
    const length = dimensions.length || shipmentData.length || 30;
    const width = dimensions.width || shipmentData.width || 20;
    const height = dimensions.height || shipmentData.height || 15;

    console.log(`[Genei] Creating shipment: ${originPostalCode} → ${destPostalCode}, rate: ${shipmentData.rate_id}`);

    const response = await fetch(`${GENEI_API_URL}/shipments`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            remite_nombre: shipmentData.origin_data?.name || "Remitente",
            remite_direccion: shipmentData.origin_data?.address || "Central",
            cp_recogida: originPostalCode,
            pais_recogida: originCountry,

            destina_nombre: shipmentData.destination_data?.name || "Destinatario",
            destina_direccion: shipmentData.destination_data?.address || "Destino",
            cp_entrega: destPostalCode,
            pais_entrega: destCountry,

            bultos: [{
                peso: weight,
                largo: length,
                ancho: width,
                alto: height
            }],
            servicio: shipmentData.rate_id?.replace("genei-", ""),
            referencia: shipmentData.id
        }),
        signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("[Genei] Label purchase failed:", response.status, errText);
        throw new Error(`Error comprando etiqueta en Genei: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Genei] Label purchased! Tracking: ${data.tracking_number}, PDF: ${data.label_url}`);
    return { tracking: data.tracking_number || `GNI-${Date.now()}`, pdf: data.label_url || null };
}
