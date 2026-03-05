'use client';

// ============================================================
// Checkout Success — Shows payment confirmation + polls shipment status
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    CheckCircle2,
    Loader2,
    Download,
    ArrowRight,
    Package,
    AlertTriangle,
    Truck,
} from 'lucide-react';

type ShipmentStatus = 'paid' | 'labels_generated' | 'manual_intervention_required' | 'pending_payment' | string;

interface ShipmentInfo {
    status: ShipmentStatus;
    tracking_number: string | null;
    label_url: string | null;
    carrier_name: string | null;
    service_name: string | null;
}

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const shipmentId = searchParams.get('shipment_id');

    const [shipment, setShipment] = useState<ShipmentInfo | null>(null);
    const [isPolling, setIsPolling] = useState(true);
    const [pollCount, setPollCount] = useState(0);

    const fetchStatus = useCallback(async () => {
        if (!shipmentId) return;

        try {
            const res = await fetch(`/api/shipment-status/${shipmentId}`);
            if (!res.ok) return;
            const data = await res.json();
            setShipment(data);

            // Stop polling when label is generated or error
            if (data.status === 'labels_generated' || data.status === 'manual_intervention_required') {
                setIsPolling(false);
            }
        } catch {
            // Silently continue polling
        }
    }, [shipmentId]);

    useEffect(() => {
        if (!shipmentId || !isPolling) return;

        fetchStatus(); // initial fetch

        const interval = setInterval(() => {
            setPollCount((prev) => {
                if (prev >= 20) { // 20 polls × 3s = 60s max
                    setIsPolling(false);
                    return prev;
                }
                fetchStatus();
                return prev + 1;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [shipmentId, isPolling, fetchStatus]);

    const isLabelReady = shipment?.status === 'labels_generated';
    const needsIntervention = shipment?.status === 'manual_intervention_required';

    return (
        <div className="px-6 py-20 max-w-2xl mx-auto text-center">
            <div className="bento-card animate-fade-in !p-10">
                {/* Status Icon */}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isLabelReady
                        ? 'bg-emerald-500/20'
                        : needsIntervention
                            ? 'bg-amber-500/20'
                            : 'bg-indigo-500/20'
                    }`}>
                    {isLabelReady ? (
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    ) : needsIntervention ? (
                        <AlertTriangle className="w-10 h-10 text-amber-400" />
                    ) : (
                        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                    )}
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-white mb-3">
                    {isLabelReady
                        ? '¡Tu etiqueta está lista!'
                        : needsIntervention
                            ? 'Pago recibido — procesando'
                            : '¡Pago completado!'}
                </h1>

                {/* Description */}
                <p className="text-white/50 mb-8 max-w-md mx-auto">
                    {isLabelReady
                        ? 'Descarga tu etiqueta, imprímela y pégala en tu paquete. También la recibirás por email.'
                        : needsIntervention
                            ? 'Tu pago se ha procesado correctamente. Nuestro equipo revisará tu envío y generará la etiqueta manualmente.'
                            : 'Estamos generando tu etiqueta de envío. Esto suele tardar unos segundos...'}
                </p>

                {/* Shipment Details Card */}
                {shipment && (shipment.carrier_name || shipment.tracking_number) && (
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 mb-8 text-left space-y-3">
                        {shipment.carrier_name && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/40 uppercase tracking-wider">Transportista</span>
                                <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-indigo-400" />
                                    <span className="text-sm text-white font-medium">
                                        {shipment.carrier_name}
                                        {shipment.service_name && ` — ${shipment.service_name}`}
                                    </span>
                                </div>
                            </div>
                        )}
                        {shipment.tracking_number && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/40 uppercase tracking-wider">Seguimiento</span>
                                <span className="text-sm text-emerald-400 font-mono font-medium">
                                    {shipment.tracking_number}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Progress Bar (during polling) */}
                {isPolling && (
                    <div className="mb-8">
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min((pollCount / 20) * 100, 95)}%` }}
                            />
                        </div>
                        <p className="text-xs text-white/30 mt-2">Generando etiqueta...</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {isLabelReady && shipment?.label_url && (
                        <a
                            href={shipment.label_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                                bg-gradient-to-r from-emerald-600 to-emerald-500
                                text-white font-semibold text-sm hover:opacity-90 transition-all
                                shadow-lg shadow-emerald-500/20"
                        >
                            <Download className="w-4 h-4" />
                            Descargar Etiqueta
                        </a>
                    )}

                    <a
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                            bg-white/[0.06] border border-white/[0.08]
                            text-white font-medium text-sm hover:bg-white/[0.1] transition-all"
                    >
                        <Package className="w-4 h-4" />
                        Ver Mis Envíos
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );
}
