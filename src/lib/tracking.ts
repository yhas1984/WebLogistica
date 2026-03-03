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
 * Get tracking info for a tracking number using native provider APIs (Shippo first)
 */
export async function getTracking(
    trackingNumber: string,
    carrierSlug: string
): Promise<TrackingData | null> {
    const shippoApiKey = process.env.SHIPPO_API_KEY;

    if (!shippoApiKey) {
        console.warn('[Tracking] No API key configured');
        throw new Error('No API key configured for Shippo tracking');
    }

    try {
        // Default to checking Shippo API for tracking
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
            console.warn(`[Tracking] Shippo tracking failed, status: ${response.status}`);
            return null; // Return null to indicate no tracking found
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
        throw error;
    }
}

