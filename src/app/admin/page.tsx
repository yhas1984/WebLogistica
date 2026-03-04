import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { DollarSign, TrendingUp, CreditCard, Package, ShieldCheck, AlertTriangle } from "lucide-react";

export const revalidate = 0; // Siempre datos en vivo, sin caché

// ── Tipos auxiliares ────────────────────────────────────────
interface ShipmentRow {
    id: string;
    created_at: string;
    status: string;
    api_provider: string | null;
    carrier_name: string | null;
    service_name: string | null;
    cost_price: number | null;
    final_price: number | null;
    origin_data: { city?: string; postalCode?: string } | null;
    destination_data: { city?: string; postalCode?: string } | null;
    user_id: string;
}

// ── Status Badge ────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        paid: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Pagado' },
        labels_generated: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Etiqueta Lista' },
        in_transit: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'En Tránsito' },
        delivered: { bg: 'bg-green-500/15', text: 'text-green-400', label: 'Entregado' },
        manual_intervention_required: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Intervención' },
        cancelled: { bg: 'bg-white/5', text: 'text-white/40', label: 'Cancelado' },
    };
    const c = config[status] || { bg: 'bg-white/5', text: 'text-white/50', label: status };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}>
            {c.label}
        </span>
    );
}

// ── Metric Card ─────────────────────────────────────────────
function MetricCard({
    title, value, subtitle, icon: Icon, accentColor,
}: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ElementType;
    accentColor: string;
}) {
    const colorMap: Record<string, string> = {
        blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
        red: 'from-red-500/20 to-red-600/5 border-red-500/20',
        green: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
        purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20',
    };
    const iconColorMap: Record<string, string> = {
        blue: 'text-blue-400', red: 'text-red-400', green: 'text-emerald-400', purple: 'text-purple-400',
    };
    const valueColorMap: Record<string, string> = {
        blue: 'text-blue-300', red: 'text-red-300', green: 'text-emerald-300', purple: 'text-purple-300',
    };

    return (
        <div className={`bento-card bg-gradient-to-br ${colorMap[accentColor]} border`}>
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider">{title}</p>
                <Icon className={`w-4 h-4 ${iconColorMap[accentColor]}`} />
            </div>
            <p className={`text-2xl font-bold ${valueColorMap[accentColor]}`}>{value}</p>
            <p className="text-xs text-white/35 mt-1">{subtitle}</p>
        </div>
    );
}

// ── Page ────────────────────────────────────────────────────
export default async function AdminDashboardPage() {
    // 1. Auth check
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) redirect("/login");

    // Solo el admin puede ver esta página
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) redirect("/dashboard");

    // 2. Admin client (bypass RLS)
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 3. Fetch all real shipments (exclude pending_payment)
    const { data: shipments, error } = await supabaseAdmin
        .from("shipments")
        .select("*")
        .neq("status", "pending_payment")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error cargando datos de admin:", error);
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="bento-card max-w-md w-full text-center">
                    <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-white mb-2">Error al cargar el panel</h2>
                    <p className="text-sm text-white/50">Verifica las claves de la base de datos (SUPABASE_SERVICE_ROLE_KEY).</p>
                </div>
            </div>
        );
    }

    const rows = (shipments || []) as ShipmentRow[];

    // 4. Financial calculations
    const totalRevenue = rows.reduce((acc, s) => acc + (s.final_price || 0), 0);
    const totalCost = rows.reduce((acc, s) => acc + (s.cost_price || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8 animate-fade-in">

            {/* ── Header ─────────────────────────────────────── */}
            <header className="flex items-center gap-3">
                <div className="icon-badge icon-badge-purple">
                    <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Centro de Mando</h1>
                    <p className="text-sm text-white/40">Control de rentabilidad y seguimiento global de envíos</p>
                </div>
            </header>

            {/* ── Metric Cards ───────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Ingresos Brutos"
                    value={`${totalRevenue.toFixed(2)} €`}
                    subtitle="Pagado por clientes"
                    icon={DollarSign}
                    accentColor="blue"
                />
                <MetricCard
                    title="Coste Logístico"
                    value={`${totalCost.toFixed(2)} €`}
                    subtitle="Pagado a transportistas"
                    icon={CreditCard}
                    accentColor="red"
                />
                <MetricCard
                    title="Ganancia Neta"
                    value={`${totalProfit.toFixed(2)} €`}
                    subtitle={`Margen promedio: ${avgMargin.toFixed(1)}%`}
                    icon={TrendingUp}
                    accentColor="green"
                />
                <MetricCard
                    title="Envíos Activos"
                    value={`${rows.length}`}
                    subtitle="Paquetes procesados"
                    icon={Package}
                    accentColor="purple"
                />
            </div>

            {/* ── Shipments Table ────────────────────────────── */}
            <div className="bento-card !p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.06]">
                    <h2 className="text-lg font-semibold text-white">Desglose Financiero por Envío</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[11px] text-white/40 uppercase tracking-wider border-b border-white/[0.06]">
                                <th className="px-5 py-3 text-left font-medium">Fecha / ID</th>
                                <th className="px-5 py-3 text-left font-medium">Ruta</th>
                                <th className="px-5 py-3 text-left font-medium">API</th>
                                <th className="px-5 py-3 text-right font-medium">Cobrado</th>
                                <th className="px-5 py-3 text-right font-medium">Tu Coste</th>
                                <th className="px-5 py-3 text-right font-medium">Ganancia</th>
                                <th className="px-5 py-3 text-center font-medium">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((shipment) => {
                                const profit = (shipment.final_price || 0) - (shipment.cost_price || 0);
                                const profitMargin = shipment.final_price && shipment.final_price > 0
                                    ? (profit / shipment.final_price) * 100
                                    : 0;
                                const userId = shipment.user_id;

                                return (
                                    <tr
                                        key={shipment.id}
                                        className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                                    >
                                        {/* Date / ID */}
                                        <td className="px-5 py-3.5">
                                            <div className="font-medium text-white/90">
                                                {new Date(shipment.created_at).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                })}
                                            </div>
                                            <div className="text-[10px] text-white/25 font-mono mt-0.5">
                                                {shipment.id.split('-')[0]}
                                            </div>
                                        </td>

                                        {/* Route */}
                                        <td className="px-5 py-3.5">
                                            <div className="font-semibold text-white/80">
                                                {shipment.origin_data?.city || '—'} → {shipment.destination_data?.city || '—'}
                                            </div>
                                            <div className="text-[10px] text-white/25 font-mono truncate max-w-[140px]">
                                                {userId?.slice(0, 8) || '—'}
                                            </div>
                                        </td>

                                        {/* Provider */}
                                        <td className="px-5 py-3.5">
                                            <span className="text-[11px] font-bold uppercase text-white/40 tracking-wider">
                                                {shipment.api_provider || '—'}
                                            </span>
                                        </td>

                                        {/* Revenue */}
                                        <td className="px-5 py-3.5 text-right font-medium text-white/80">
                                            {shipment.final_price?.toFixed(2) ?? '—'} €
                                        </td>

                                        {/* Cost */}
                                        <td className="px-5 py-3.5 text-right font-medium text-red-400/80">
                                            -{shipment.cost_price?.toFixed(2) ?? '—'} €
                                        </td>

                                        {/* Profit */}
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="font-bold text-emerald-400">+{profit.toFixed(2)} €</div>
                                            <div className="text-[10px] text-white/25 mt-0.5">
                                                Margen {profitMargin.toFixed(1)}%
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-3.5 text-center">
                                            <StatusBadge status={shipment.status} />
                                        </td>
                                    </tr>
                                );
                            })}

                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-white/30">
                                        <Package className="w-8 h-8 mx-auto mb-3 text-white/15" />
                                        Aún no hay envíos pagados registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
