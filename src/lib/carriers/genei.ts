// ============================================================
// Genei v2 Carrier Adapter (Production)
// ✅ Token caching via login (15-day token, cached 14 days)
// ✅ Avoids rate-limiting from repeated auth calls
// ============================================================

import type { CarrierAdapter, CarrierRate, CarrierRateRequest } from './types';
import { getDemoRates } from './types';

const GENEI_API_URL = 'https://apiv2.genei.es/api/v2';

// ── Sistema de caché de Token ───────────────────────────────
// Usamos globalThis para entornos Serverless donde el estado puede borrarse pero global persiste algo más
const globalForGenei = globalThis as unknown as { cachedToken: string | null, tokenExpiresAt: number };
if (typeof globalForGenei.cachedToken === 'undefined') {
    globalForGenei.cachedToken = null;
    globalForGenei.tokenExpiresAt = 0;
}

async function getGeneiToken(): Promise<string> {
    // Si tenemos un token válido (con margen de seguridad de 1 hora), lo reusamos
    if (globalForGenei.cachedToken && Date.now() < globalForGenei.tokenExpiresAt - 3600000) {
        return globalForGenei.cachedToken;
    }

    // Primero intentar con API key directa (si existe)
    const directKey = process.env.GENEI_API_KEY;
    const geneiEmail = process.env.GENEI_EMAIL;
    const geneiPassword = process.env.GENEI_PASSWORD;

    // Si tenemos email+password, hacemos login real para obtener token fresco
    if (geneiEmail && geneiPassword) {
        console.log('[Genei] Authenticating via login endpoint...');
        const response = await fetch(`${GENEI_API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: geneiEmail, password: geneiPassword }),
            signal: AbortSignal.timeout(10000),
            cache: 'no-store',
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("[Genei] Auth Error:", errText);
            throw new Error("Fallo en la autenticación con Genei v2");
        }

        const data = await response.json();
        globalForGenei.cachedToken = data.token;
        // Cacheamos 14 días (en milisegundos)
        globalForGenei.tokenExpiresAt = Date.now() + (14 * 24 * 60 * 60 * 1000);
        console.log('[Genei] Token cached successfully (14 days)');
        return globalForGenei.cachedToken!;
    }

    // Fallback: usar API key directa del .env
    if (directKey) {
        globalForGenei.cachedToken = directKey;
        globalForGenei.tokenExpiresAt = Date.now() + (24 * 60 * 60 * 1000); // 1 día de caché
        return globalForGenei.cachedToken;
    }

    throw new Error("[Genei] Missing auth: set GENEI_EMAIL+GENEI_PASSWORD or GENEI_API_KEY");
}

// ── Rate Fetching ───────────────────────────────────────────
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
                signal: AbortSignal.timeout(8000),
            });

            if (!response.ok) {
                console.error("[Genei] HTTP error:", response.status, response.statusText);
                const errText = await response.text();
                console.error("[Genei] Body:", errText);

                // Si el error es 401, invalidar token cacheado
                if (response.status === 401) {
                    globalForGenei.cachedToken = null;
                    globalForGenei.tokenExpiresAt = 0;
                    console.warn('[Genei] Token invalidated, will re-auth on next request');
                }
                return getDemoRates('genei', params.parcel);
            }

            const data = await response.json();

            const result = (Array.isArray(data) ? data : []).map((agency: any) => ({
                id: `genei-${agency.id_tarifa || agency.id}`,
                provider: 'genei' as const,
                carrierName: agency.nombre_agencia || agency.nombre || 'Genei Carrier',
                serviceName: agency.nombre_servicio || 'Genei Service',
                serviceType: (agency.requiere_impresora === "0" ? 'drop_off' : 'door_to_door') as 'door_to_door' | 'drop_off',
                estimatedDays: parseInt(agency.plazo_entregas) || 5,
                costPrice: parseFloat(agency.total_precio || agency.total),
                finalPrice: 0,
                currency: 'EUR',
            }));

            if (result.length === 0) {
                console.warn("[Genei] Returned 0 rates. Body was:", JSON.stringify(data));
                return []; // No devolvemos demo por defecto en producción si falla
            }

            return result;
        } catch (error) {
            console.error("[Genei] API Error/Timeout:", error);
            return [];
        }
    },
};

// ── Label Purchase ──────────────────────────────────────────
export async function getGeneiLabel(shipmentData: any): Promise<{ tracking: string; pdf: string | null }> {
    const token = await getGeneiToken();

    // Support both DB column formats: direct columns OR nested in origin_data/destination_data
    const originPostalCode = shipmentData.origin_postal_code || shipmentData.origin_data?.postalCode;
    const originCountry = shipmentData.origin_country || shipmentData.origin_data?.countryCode || 'ES';
    const destPostalCode = shipmentData.destination_postal_code || shipmentData.destination_data?.postalCode;
    const destCountry = shipmentData.destination_country || shipmentData.destination_data?.countryCode || 'ES';

    if (!originPostalCode || !destPostalCode) {
        throw new Error(`[Genei] Missing postal codes: origin=${originPostalCode}, dest=${destPostalCode}`);
    }

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
            id_tarifa: shipmentData.rate_id?.replace("genei-", "") || shipmentData.external_id,
            nombre_remitente: shipmentData.origin_data?.name || "Remitente",
            direccion_remitente: shipmentData.origin_data?.address || "Central",
            poblacion_remitente: shipmentData.origin_data?.city || "",
            cp_remitente: originPostalCode,
            pais_remitente: originCountry,
            telefono_remitente: shipmentData.origin_data?.phone || "600000000",
            email_remitente: shipmentData.origin_data?.email || process.env.ADMIN_EMAIL,
            nombre_destinatario: shipmentData.destination_data?.name || "Destinatario",
            direccion_destinatario: shipmentData.destination_data?.address || "Destino",
            poblacion_destinatario: shipmentData.destination_data?.city || "",
            cp_destinatario: destPostalCode,
            pais_destinatario: destCountry,
            telefono_destinatario: shipmentData.destination_data?.phone || "600000000",
            contenido: "Bienes personales / Ecommerce",
            bultos: [{ peso: weight, largo: length, ancho: width, alto: height }],
            referencia: shipmentData.id
        }),
        signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
        // Si 401, invalidar token
        if (response.status === 401) {
            globalForGenei.cachedToken = null;
            globalForGenei.tokenExpiresAt = 0;
        }
        const errText = await response.text();
        console.error("[Genei] Label purchase failed:", response.status, errText);
        throw new Error(`Error comprando etiqueta en Genei: ${response.status}`);
    }

    const data = await response.json();

    // Genei v2 puede devolver { status: false, error: "..." } incluso con HTTP 200
    if (data.status === false || (data.success === false)) {
        console.error("[Genei] API responded with error body:", data);
        throw new Error(data.error || data.message || "Error en la respuesta de Genei");
    }

    console.log(`[Genei] Response Data:`, JSON.stringify(data));

    // Mapeo flexible de campos según diferentes versiones de la API v2
    const tracking = data.codigo_envio || data.tracking_number || data.envio?.codigo_envio || data.envio?.tracking_number;
    const pdf = data.url_etiqueta || data.label_url || data.envio?.url_etiqueta || data.envio?.label_url;

    if (!tracking) {
        console.warn("[Genei] No tracking number in response, using fallback.");
    }

    return {
        tracking: tracking || `GNI-${Date.now()}`,
        pdf: pdf || null
    };
}
