import { createClient } from '@/lib/supabase/server';
import { Package, Clock, Truck, CheckCircle2, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Mis Envíos | WebLogistica',
    description: 'Panel de control de tus envíos en WebLogistica',
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    quoted: { label: 'Cotizado', color: 'text-white/50', icon: <Clock className="w-4 h-4" /> },
    paid: { label: 'Pagado', color: 'text-blue-400', icon: <CheckCircle2 className="w-4 h-4" /> },
    label_created: { label: 'Etiqueta lista', color: 'text-purple-400', icon: <FileText className="w-4 h-4" /> },
    in_transit: { label: 'En tránsito', color: 'text-amber-400', icon: <Truck className="w-4 h-4" /> },
    delivered: { label: 'Entregado', color: 'text-emerald-400', icon: <CheckCircle2 className="w-4 h-4" /> },
};

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch real shipments for the logged in user
    const { data: shipments = [] } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });

    // Calculate real stats
    const totalShipments = shipments?.length || 0;
    const inTransit = shipments?.filter(s => s.status === 'in_transit').length || 0;
    const delivered = shipments?.filter(s => s.status === 'delivered').length || 0;

    return (
        <div className="px-6 py-12 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Package className="w-6 h-6 text-blue-400" />
                        Mis Envíos
                    </h1>
                    <p className="text-white/40 text-sm mt-1">
                        Gestiona y rastrea todos tus envíos
                    </p>
                </div>
                <Link
                    href="/"
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white
                     bg-gradient-to-r from-blue-600 to-purple-600
                     hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Envío
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Total Envíos', value: totalShipments.toString(), color: 'text-white' },
                    { label: 'En Tránsito', value: inTransit.toString(), color: 'text-amber-400' },
                    { label: 'Entregados', value: delivered.toString(), color: 'text-emerald-400' },
                ].map((stat, i) => (
                    <div key={i} className="bento-card text-center">
                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-white/40 mt-1 uppercase tracking-wider">
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Shipments List */}
            <div className="space-y-3">
                {(!shipments || shipments.length === 0) ? (
                    <div className="bento-card py-12 text-center">
                        <div className="icon-badge icon-badge-blue mx-auto mb-4">
                            <Package className="w-6 h-6" />
                        </div>
                        <h3 className="text-white font-semibold mb-1">No tienes envíos todavía</h3>
                        <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto">
                            Comienza realizando una cotización para ver tus envíos aquí.
                        </p>
                        <Link
                            href="/"
                            className="text-blue-400 text-sm font-medium hover:underline"
                        >
                            Realizar primera cotización &rarr;
                        </Link>
                    </div>
                ) : (
                    shipments.map((shipment) => {
                        const status = STATUS_MAP[shipment.status] || STATUS_MAP.quoted;
                        // Extract destination info from JSONB or fallback
                        const dest = shipment.destination_data as any;
                        const destinationLabel = dest?.city
                            ? `${dest.city}, ${dest.country}`
                            : 'Destino no especificado';

                        return (
                            <div
                                key={shipment.id}
                                className="bento-card flex items-center gap-4 hover:border-white/20 transition-colors group"
                            >
                                <div className={`${status.color}`}>{status.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-white font-medium text-sm truncate">
                                            {shipment.carrier_name} — {shipment.service_name}
                                        </p>
                                        <span
                                            className={`text-[10px] px-2 py-0.5 rounded-full border ${status.color}
                          bg-white/[0.03] border-current font-medium uppercase tracking-wider`}
                                        >
                                            {status.label}
                                        </span>
                                    </div>
                                    <p className="text-white/30 text-xs mt-0.5">
                                        {shipment.tracking_number || 'Pendiente de etiqueta'} · {destinationLabel} ·{' '}
                                        {new Date(shipment.created_at).toLocaleDateString('es-ES')}
                                    </p>
                                </div>
                                <p className="text-white font-semibold text-sm">
                                    {Number(shipment.final_price).toFixed(2)}€
                                </p>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

