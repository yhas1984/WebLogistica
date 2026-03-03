import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
    Package, ArrowLeft, MapPin, Truck, Clock,
    Download, Hash, CalendarDays, Weight, Ruler,
    CheckCircle2, AlertTriangle,
} from 'lucide-react';

export const metadata = {
    title: 'Detalle de Envío | WebLogistica',
    description: 'Consulta el estado y detalles de tu envío.',
};

export default async function TrackingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Fetch shipment — try by ID first, then by tracking number
    let { data: shipment } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (!shipment) {
        const { data: byTracking } = await supabase
            .from('shipments')
            .select('*')
            .eq('tracking_number', id)
            .eq('user_id', user.id)
            .single();
        shipment = byTracking;
    }

    if (!shipment) notFound();

    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        quoted: { label: 'Cotizado', color: 'text-white/60', icon: <Clock className="w-5 h-5" /> },
        pending_payment: { label: 'Pendiente de Pago', color: 'text-amber-400', icon: <Clock className="w-5 h-5" /> },
        paid: { label: 'Pagado', color: 'text-blue-400', icon: <CheckCircle2 className="w-5 h-5" /> },
        labels_generated: { label: 'Etiqueta Lista', color: 'text-emerald-400', icon: <CheckCircle2 className="w-5 h-5" /> },
        label_created: { label: 'Etiqueta Lista', color: 'text-emerald-400', icon: <CheckCircle2 className="w-5 h-5" /> },
        in_transit: { label: 'En Tránsito', color: 'text-amber-400', icon: <Truck className="w-5 h-5" /> },
        delivered: { label: 'Entregado', color: 'text-emerald-400', icon: <CheckCircle2 className="w-5 h-5" /> },
        manual_intervention_required: { label: 'Intervención Manual', color: 'text-red-400', icon: <AlertTriangle className="w-5 h-5" /> },
        cancelled: { label: 'Cancelado', color: 'text-white/40', icon: <Clock className="w-5 h-5" /> },
    };

    const status = statusConfig[shipment.status] || statusConfig.quoted;
    const origin = (shipment.origin_data as any) || {};
    const dest = (shipment.destination_data as any) || {};
    const dims = (shipment.dimensions as any) || {};

    return (
        <div className="container mx-auto py-10 px-4 max-w-3xl">
            {/* Back link */}
            <Link
                href="/dashboard"
                className="inline-flex items-center text-sm text-white/50 hover:text-white transition-colors mb-8 gap-1"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver a Mis Envíos
            </Link>

            {/* Header Card */}
            <div className="bento-card mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-500/10 p-3 rounded-full">
                            <Package className="w-7 h-7 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">
                                {origin.city || 'Origen'} → {dest.city || 'Destino'}
                            </h1>
                            <p className="text-white/40 text-sm mt-0.5">
                                {shipment.carrier_name || shipment.provider} · {shipment.service_name || 'Servicio estándar'}
                            </p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.color} bg-white/5 border border-current/20`}>
                        {status.icon}
                        {status.label}
                    </span>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Tracking Number */}
                <div className="bento-card">
                    <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-2">
                        <Hash className="w-3.5 h-3.5" />
                        Nº de Seguimiento
                    </div>
                    <p className="text-white font-mono font-semibold text-lg">
                        {shipment.tracking_number || 'Pendiente'}
                    </p>
                </div>

                {/* Price */}
                <div className="bento-card">
                    <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-2">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Precio Final
                    </div>
                    <p className="text-white font-bold text-2xl">
                        {shipment.final_price ? `${Number(shipment.final_price).toFixed(2)}€` : '—'}
                    </p>
                </div>

                {/* Origin */}
                <div className="bento-card">
                    <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        Origen
                    </div>
                    <p className="text-white font-medium">
                        {origin.city || 'No especificado'}
                    </p>
                    <p className="text-white/50 text-sm">
                        CP {shipment.origin_postal_code || origin.postalCode || '—'} · {shipment.origin_country || origin.country || '—'}
                    </p>
                </div>

                {/* Destination */}
                <div className="bento-card">
                    <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        Destino
                    </div>
                    <p className="text-white font-medium">
                        {dest.city || 'No especificado'}
                    </p>
                    <p className="text-white/50 text-sm">
                        CP {shipment.destination_postal_code || dest.postalCode || '—'} · {shipment.destination_country || dest.country || '—'}
                    </p>
                </div>

                {/* Dimensions */}
                <div className="bento-card">
                    <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-2">
                        <Ruler className="w-3.5 h-3.5" />
                        Dimensiones
                    </div>
                    <p className="text-white font-medium">
                        {dims.length || '—'} × {dims.width || '—'} × {dims.height || '—'} cm
                    </p>
                </div>

                {/* Weight */}
                <div className="bento-card">
                    <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-2">
                        <Weight className="w-3.5 h-3.5" />
                        Peso
                    </div>
                    <p className="text-white font-medium">
                        {dims.weight ? `${dims.weight} kg` : '—'}
                    </p>
                </div>
            </div>

            {/* Dates */}
            <div className="bento-card mb-6">
                <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-3">
                    <Clock className="w-3.5 h-3.5" />
                    Historial
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/70">
                        <span>Creado</span>
                        <span className="text-white">
                            {new Date(shipment.created_at).toLocaleDateString('es-ES', {
                                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                    </div>
                    {shipment.updated_at && shipment.updated_at !== shipment.created_at && (
                        <div className="flex justify-between text-white/70">
                            <span>Última actualización</span>
                            <span className="text-white">
                                {new Date(shipment.updated_at).toLocaleDateString('es-ES', {
                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                {shipment.label_url ? (
                    <a
                        href={shipment.label_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex flex-1 items-center justify-center rounded-xl text-sm font-medium transition-colors bg-white text-black hover:bg-white/90 h-12 px-6 gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Descargar Etiqueta (PDF)
                    </a>
                ) : (
                    <button
                        disabled
                        className="inline-flex flex-1 items-center justify-center rounded-xl text-sm font-medium border border-white/10 bg-white/5 text-white/40 cursor-not-allowed h-12 px-6 gap-2"
                    >
                        <Truck className="h-4 w-4" />
                        Etiqueta en proceso...
                    </button>
                )}
            </div>
        </div>
    );
}
