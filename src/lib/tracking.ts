// ============================================================
// Carrier Native Tracking Client
// API: https://api.goshippo.com/tracks/
// ============================================================

const SHIPPO_API_URL = 'https://api.goshippo.com';

export interface TrackingData {
    id: string;
    tracking_number: string;
    slug: string; // carrier code
    tag: string;  // status tag
    title: string;
    checkpoints: TrackingCheckpoint[];
    expected_delivery: string | null;
    provider: string; // e.g., 'shippo' or 'genei'
}

export interface TrackingCheckpoint {
    slug: string;
    city: string;
    created_at: string;
    message: string;
    tag: string;
    checkpoint_time: string;
    location: string;
}

/**
 * Get tracking info for a tracking number using native provider APIs
 */
export async function getTracking(
    trackingNumber: string,
    carrierSlug: string
): Promise<TrackingData | null> {
    const shippoApiKey = process.env.SHIPPO_API_KEY;

    // ── Fallback para rastreos internos (GNI-...) ────────────────
    if (trackingNumber.startsWith('GNI-') || trackingNumber.startsWith('WL')) {
        return {
            id: trackingNumber,
            tracking_number: trackingNumber,
            slug: carrierSlug || 'carrier',
            tag: 'PRE_TRANSIT',
            title: `Envío ${trackingNumber}`,
            expected_delivery: null,
            provider: 'internal',
            checkpoints: [
                {
                    slug: carrierSlug || 'carrier',
                    city: 'Almacén',
                    created_at: new Date().toISOString(),
                    message: 'La etiqueta ha sido generada y el paquete está a la espera de ser recogido.',
                    tag: 'PRE_TRANSIT',
                    checkpoint_time: new Date().toISOString(),
                    location: 'Origen'
                }
            ]
        };
    }

    if (!shippoApiKey) {
        console.warn('[Tracking] No API key configured');
        return null;
    }

    try {
        // En un escenario real, aquí bifurcaríamos según el carrier o proveedor
        // Para simplificar, usamos Shippo como orquestador de rastreo universal
        const response = await fetch(
            `${SHIPPO_API_URL}/tracks/${carrierSlug}/${trackingNumber}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `ShippoToken ${shippoApiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.warn(`[Tracking] Shippo tracking failed, status: ${response.status} for ${trackingNumber}`);

            // Si Shippo falla pero tenemos un tracking válido, devolvemos un estado básico
            return {
                id: trackingNumber,
                tracking_number: trackingNumber,
                slug: carrierSlug,
                tag: 'UNKNOWN',
                title: `Envío ${trackingNumber}`,
                expected_delivery: null,
                provider: 'fallback',
                checkpoints: [
                    {
                        slug: carrierSlug,
                        city: '',
                        created_at: new Date().toISOString(),
                        message: 'Información de rastreo no disponible de momento. Es posible que el paquete aún no haya sido escaneado.',
                        tag: 'UNKNOWN',
                        checkpoint_time: new Date().toISOString(),
                        location: ''
                    }
                ]
            };
        }

        const data = await response.json();

        return {
            id: data.tracking_number,
            tracking_number: data.tracking_number,
            slug: data.carrier,
            tag: data.tracking_status?.status || 'UNKNOWN',
            title: `Shipment ${data.tracking_number}`,
            expected_delivery: data.eta || null,
            provider: 'shippo',
            checkpoints: (data.tracking_history || []).map((checkpoint: any) => ({
                slug: data.carrier,
                city: checkpoint.location?.city || '',
                created_at: checkpoint.status_date,
                message: checkpoint.status_details || '',
                tag: checkpoint.status || '',
                checkpoint_time: checkpoint.status_date,
                location: checkpoint.location?.city ? `${checkpoint.location.city}, ${checkpoint.location.country}` : '',
            }))
        };
    } catch (error) {
        console.error('[Tracking] Get tracking failed:', error);
        return null;
    }
}

