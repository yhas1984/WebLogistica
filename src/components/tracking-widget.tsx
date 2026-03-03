'use client';

// ============================================================
// TrackingWidget — AfterShip Tracking Display
// ============================================================

import { useState } from 'react';
import {
    Search,
    Package,
    CheckCircle2,
    Truck,
    MapPin,
    Clock,
    Loader2,
} from 'lucide-react';

interface Checkpoint {
    message: string;
    location: string;
    checkpoint_time: string;
    tag: string;
}

interface TrackingData {
    tracking_number: string;
    tag: string;
    expected_delivery: string | null;
    checkpoints: Checkpoint[];
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    InTransit: {
        icon: <Truck className="w-5 h-5" />,
        color: 'text-blue-400',
        label: 'En tránsito',
    },
    Delivered: {
        icon: <CheckCircle2 className="w-5 h-5" />,
        color: 'text-emerald-400',
        label: 'Entregado',
    },
    OutForDelivery: {
        icon: <MapPin className="w-5 h-5" />,
        color: 'text-amber-400',
        label: 'En reparto',
    },
    InfoReceived: {
        icon: <Package className="w-5 h-5" />,
        color: 'text-purple-400',
        label: 'Información recibida',
    },
};

export default function TrackingWidget() {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!trackingNumber.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/tracking/${trackingNumber}`);
            if (!res.ok) throw new Error('No se encontraron resultados');
            const data = await res.json();
            setTrackingData(data);
        } catch {
            setError('No se pudo obtener la información de seguimiento');
            setTrackingData(null);
        } finally {
            setIsLoading(false);
        }
    }

    const statusConfig = trackingData
        ? STATUS_CONFIG[trackingData.tag] || STATUS_CONFIG.InTransit
        : null;

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Introduce tu número de seguimiento"
                        className="form-input pl-11 py-3"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600
                     text-white font-medium text-sm hover:opacity-90 transition-opacity
                     disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rastrear'}
                </button>
            </form>

            {/* Error */}
            {error && (
                <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
            )}

            {/* Tracking Result */}
            {trackingData && statusConfig && (
                <div className="mt-6 bento-card animate-fade-in">
                    {/* Status Header */}
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                        <div className={`${statusConfig.color}`}>{statusConfig.icon}</div>
                        <div>
                            <p className="text-white font-semibold">{statusConfig.label}</p>
                            <p className="text-white/40 text-xs">
                                {trackingData.tracking_number}
                            </p>
                        </div>
                        {trackingData.expected_delivery && (
                            <div className="ml-auto text-right">
                                <p className="text-xs text-white/40 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Entrega estimada
                                </p>
                                <p className="text-sm text-white font-medium">
                                    {new Date(trackingData.expected_delivery).toLocaleDateString('es-ES')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                        {trackingData.checkpoints.map((cp, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-white/20'
                                            }`}
                                    />
                                    {i < trackingData.checkpoints.length - 1 && (
                                        <div className="w-px h-full bg-white/10 mt-1" />
                                    )}
                                </div>
                                <div className="pb-4">
                                    <p className="text-white text-sm font-medium">{cp.message}</p>
                                    <p className="text-white/40 text-xs mt-0.5">
                                        {cp.location} · {new Date(cp.checkpoint_time).toLocaleString('es-ES')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
