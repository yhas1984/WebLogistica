// ============================================================
// Genei v2 Carrier Adapter
// Handles Bearer Token Auth logic extending for 15 days
// and provides real API requests to v2 endpoints.
// ============================================================

import type { CarrierAdapter, CarrierRate, CarrierRateRequest } from './types';

const GENEI_API_URL = 'https://apiv2.genei.es/api/v2';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getGeneiToken() {
    if (cachedToken && Date.now() < tokenExpiresAt) {
        return cachedToken;
    }

    const email = process.env.GENEI_EMAIL;
    const password = process.env.GENEI_PASSWORD;

    if (!email || !password) {
        throw new Error("[Genei] email or password missing from environment variables");
    }

    const response = await fetch(`${GENEI_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) throw new Error("Fallo en la autenticación con Genei");
    const data = await response.json();
    cachedToken = data.token;

    // Este token dura 15 días, establecemos el caché con expiración a los 14 días (preventiva)
    tokenExpiresAt = Date.now() + 14 * 24 * 60 * 60 * 1000;

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
                    "Content-Type": "application/json"
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
                signal: AbortSignal.timeout(15000),
            });

            if (!response.ok) return [];

            const data = await response.json();

            // Mapeo de la respuesta de Genei a nuestro formato estándar
            return (Array.isArray(data) ? data : []).map((agency: any) => ({
                id: `genei-${agency.id}`,
                provider: 'genei' as const,
                carrierName: agency.nombre || 'Genei Carrier',
                serviceName: agency.nombre_servicio || 'Genei Service',
                estimatedDays: parseInt(agency.plazo_entregas) || 5,
                costPrice: parseFloat(agency.total),
                finalPrice: 0, // se calcula en el orquestador
                currency: 'EUR',
            }));
        } catch (error) {
            console.error("[Genei] API Error:", error);
            return [];
        }
    },
};
