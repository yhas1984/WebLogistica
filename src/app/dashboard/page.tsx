import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Package, Download, Truck, Clock, ArrowRight, CreditCard, Trash2, AlertTriangle, CheckCircle, Loader2, MapPin } from 'lucide-react';
import Link from 'next/link';
import { DashboardActions } from './dashboard-actions';

export const metadata = {
    title: 'Mis Envíos | WebLogistica',
    description: 'Gestiona y rastrea tus paquetes globales.',
};

// Status config map for consistent badges and descriptions
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string; description: string }> = {
    pending_payment: {
        label: 'Pendiente de Pago',
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: '💳',
        description: 'Este envío está a la espera de que completes el pago.',
    },
    paid: {
        label: 'Pago Confirmado',
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        icon: '✅',
        description: 'Pago recibido. Generando tu etiqueta de envío...',
    },
    labels_generated: {
        label: 'Etiqueta Lista',
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: '📦',
        description: 'Tu etiqueta está lista para descargar. ¡Pégala en tu paquete!',
    },
    in_transit: {
        label: 'En Tránsito',
        color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        icon: '🚚',
        description: 'Tu paquete va camino del destinatario.',
    },
    delivered: {
        label: 'Entregado',
        color: 'bg-green-500/10 text-green-400 border-green-500/20',
        icon: '🎉',
        description: '¡Paquete entregado con éxito!',
    },
    manual_intervention_required: {
        label: 'Requiere Atención',
        color: 'bg-red-500/10 text-red-400 border-red-500/20',
        icon: '⚠️',
        description: 'Hubo un problema. Contacta soporte para resolverlo.',
    },
    cancelled: {
        label: 'Cancelado',
        color: 'bg-white/5 text-white/40 border-white/10',
        icon: '🚫',
        description: 'Este envío fue cancelado.',
    },
};

// Normalize legacy status values
function normalizeStatus(status: string): string {
    if (status === 'quoted') return 'pending_payment';
    return status;
}

function getStatusConfig(status: string) {
    const normalized = normalizeStatus(status);
    return STATUS_CONFIG[normalized] || {
        label: status,
        color: 'bg-white/10 text-white/70 border-white/20',
        icon: '📋',
        description: '',
    };
}

export default async function DashboardPage() {
    const supabase = await createClient();

    // 1. Verificar sesión
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // 2. Obtener envíos del usuario
    const { data: shipments } = await supabase
        .from('shipments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    // 3. Stats rápidas (normalize status for backwards compat)
    const totalShipments = shipments?.length || 0;
    const pendingPayment = shipments?.filter(s => normalizeStatus(s.status) === 'pending_payment').length || 0;
    const labelsReady = shipments?.filter(s => normalizeStatus(s.status) === 'labels_generated').length || 0;
    const inTransit = shipments?.filter(s => normalizeStatus(s.status) === 'in_transit').length || 0;

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            {/* Header */}
            <header className="mb-8 pl-2 border-l-4 border-blue-500">
                <h1 className="text-3xl font-bold text-white">Mis Envíos</h1>
                <p className="text-white/60 mt-1">Gestiona y rastrea tus paquetes globales.</p>
            </header>

            {/* Stats Cards */}
            {totalShipments > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bento-card !p-4 text-center">
                        <p className="text-2xl font-bold text-white">{totalShipments}</p>
                        <p className="text-xs text-white/50 mt-1">Total Envíos</p>
                    </div>
                    <div className="bento-card !p-4 text-center border-l-2 border-l-amber-500/50">
                        <p className="text-2xl font-bold text-amber-400">{pendingPayment}</p>
                        <p className="text-xs text-white/50 mt-1">Pendientes de Pago</p>
                    </div>
                    <div className="bento-card !p-4 text-center border-l-2 border-l-emerald-500/50">
                        <p className="text-2xl font-bold text-emerald-400">{labelsReady}</p>
                        <p className="text-xs text-white/50 mt-1">Etiquetas Listas</p>
                    </div>
                    <div className="bento-card !p-4 text-center border-l-2 border-l-purple-500/50">
                        <p className="text-2xl font-bold text-purple-400">{inTransit}</p>
                        <p className="text-xs text-white/50 mt-1">En Tránsito</p>
                    </div>
                </div>
            )}

            {/* Shipment List */}
            <div className="grid gap-5">
                {!shipments || shipments.length === 0 ? (
                    <div className="bento-card border-dashed text-center py-16">
                        <Package className="w-12 h-12 text-blue-500/50 mx-auto mb-4" />
                        <h2 className="text-xl text-white font-medium mb-2">Todavía no has realizado ningún envío.</h2>
                        <p className="text-white/40 mb-6">Realiza tu primera cotización para ver tus envíos aquí.</p>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-blue-600 text-white hover:bg-blue-600/90 h-10 px-6 py-2"
                        >
                            Empezar ahora <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    shipments.map((rawShipment) => {
                        // Normalize status for backwards compat
                        const shipment = { ...rawShipment, status: normalizeStatus(rawShipment.status) };
                        const statusCfg = getStatusConfig(shipment.status);
                        const originCity = shipment.origin_data?.city || shipment.origin_data?.postalCode || 'Origen';
                        const destCity = shipment.destination_data?.city || shipment.destination_data?.postalCode || 'Destino';
                        const price = shipment.final_price ? Number(shipment.final_price).toFixed(2) : null;

                        return (
                            <div
                                key={shipment.id}
                                className={`bento-card overflow-hidden !p-0 border-l-4 ${shipment.status === 'pending_payment' ? 'border-l-amber-500' :
                                    shipment.status === 'labels_generated' ? 'border-l-emerald-500' :
                                        shipment.status === 'paid' ? 'border-l-blue-500' :
                                            shipment.status === 'in_transit' ? 'border-l-purple-500' :
                                                shipment.status === 'manual_intervention_required' ? 'border-l-red-500' :
                                                    'border-l-white/20'
                                    }`}
                            >
                                <div className="p-5 md:p-6">
                                    {/* Top row: Route + Status */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${shipment.status === 'pending_payment' ? 'bg-amber-500/10' :
                                                shipment.status === 'labels_generated' ? 'bg-emerald-500/10' :
                                                    'bg-blue-500/10'
                                                }`}>
                                                <Package className={`h-6 w-6 ${shipment.status === 'pending_payment' ? 'text-amber-400' :
                                                    shipment.status === 'labels_generated' ? 'text-emerald-400' :
                                                        'text-blue-400'
                                                    }`} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-white/40" />
                                                    {originCity}
                                                    <ArrowRight className="h-4 w-4 text-white/30" />
                                                    {destCity}
                                                </h3>
                                                <p className="text-sm text-white/40">
                                                    {shipment.carrier_name} — {shipment.service_name}
                                                </p>
                                            </div>
                                        </div>

                                        <span className={`inline-flex items-center self-start rounded-full px-3 py-1 text-xs font-semibold border ${statusCfg.color}`}>
                                            <span className="mr-1.5">{statusCfg.icon}</span>
                                            {statusCfg.label}
                                        </span>
                                    </div>

                                    {/* Info row */}
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/50 mb-4">
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" />
                                            {new Date(shipment.created_at).toLocaleDateString('es-ES', {
                                                day: 'numeric', month: 'long', year: 'numeric'
                                            })}
                                        </span>
                                        {price && (
                                            <span className="font-medium text-white/70">
                                                {price} €
                                            </span>
                                        )}
                                        {shipment.tracking_number && (
                                            <span className="flex items-center gap-1.5 font-mono text-xs bg-white/5 px-2 py-0.5 rounded">
                                                <Truck className="h-3.5 w-3.5" />
                                                {shipment.tracking_number}
                                            </span>
                                        )}
                                    </div>

                                    {/* Status description */}
                                    {statusCfg.description && (
                                        <p className="text-xs text-white/40 mb-4 pl-1 border-l-2 border-white/10">
                                            {statusCfg.description}
                                        </p>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3 pt-3 border-t border-white/5">
                                        {/* PENDING PAYMENT: Pay + Delete */}
                                        {shipment.status === 'pending_payment' && (
                                            <DashboardActions
                                                shipmentId={shipment.id}
                                                status={shipment.status}
                                            />
                                        )}

                                        {/* PAID: Processing indicator */}
                                        {shipment.status === 'paid' && (
                                            <div className="inline-flex items-center gap-2 text-sm text-blue-400">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Generando etiqueta de envío...
                                            </div>
                                        )}

                                        {/* LABELS GENERATED: Download */}
                                        {shipment.status === 'labels_generated' && shipment.label_url && (
                                            <a
                                                href={shipment.label_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all bg-emerald-600 hover:bg-emerald-500 text-white h-10 px-5 gap-2 shadow-lg shadow-emerald-500/20"
                                            >
                                                <Download className="h-4 w-4" />
                                                Descargar Etiqueta
                                            </a>
                                        )}

                                        {/* MANUAL INTERVENTION: Contact support */}
                                        {shipment.status === 'manual_intervention_required' && (
                                            <div className="inline-flex items-center gap-2 text-sm text-red-400">
                                                <AlertTriangle className="h-4 w-4" />
                                                Contacta soporte para resolver este envío.
                                            </div>
                                        )}

                                        {/* DELIVERED */}
                                        {shipment.status === 'delivered' && (
                                            <div className="inline-flex items-center gap-2 text-sm text-green-400">
                                                <CheckCircle className="h-4 w-4" />
                                                Entregado con éxito
                                            </div>
                                        )}

                                        {/* Tracking details for all non-cancelled */}
                                        {shipment.status !== 'cancelled' && (
                                            <Link
                                                href={`/tracking/${shipment.id}`}
                                                className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all hover:bg-white/10 text-blue-400 hover:text-blue-300 h-10 px-4"
                                            >
                                                Detalles <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
