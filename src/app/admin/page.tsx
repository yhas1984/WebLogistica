import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { approveManualPayment, deleteShipmentAdmin, updateShipmentStatusAdmin } from "@/actions/admin";
import {
    DollarSign,
    TrendingUp,
    CreditCard,
    Package,
    ShieldCheck,
    AlertTriangle,
    AlertCircle,
    FileText,
    CheckCircle,
    Trash2,
    Save
} from "lucide-react";

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
    label_url: string | null;
    stripe_session_id: string | null;
    stripe_payment_id: string | null;
}

// ── Status Badge ────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        pending_payment: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Pend. Pago' },
        paid: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Pagado' },
        labels_generated: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Etiqueta Lista' },
        in_transit: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', label: 'En Tránsito' },
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
    title, value, subtitle, icon: Icon, accentColor, extra,
}: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ElementType;
    accentColor: string;
    extra?: React.ReactNode;
}) {
    const colorMap: Record<string, string> = {
        blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
        red: 'from-red-500/20 to-red-600/5 border-red-500/20',
        green: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
        purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20',
    };
    const iconColor: Record<string, string> = {
        blue: 'text-blue-400', red: 'text-red-400', green: 'text-emerald-400', purple: 'text-purple-400',
    };
    const valueColor: Record<string, string> = {
        blue: 'text-blue-300', red: 'text-red-300', green: 'text-emerald-300', purple: 'text-purple-300',
    };

    return (
        <div className={`bento-card bg-gradient-to-br ${colorMap[accentColor]} border`}>
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider">{title}</p>
                <Icon className={`w-4 h-4 ${iconColor[accentColor]}`} />
            </div>
            <p className={`text-2xl font-bold ${valueColor[accentColor]}`}>{value}</p>
            <p className="text-xs text-white/35 mt-1">{subtitle}</p>
            {extra && <div className="mt-2">{extra}</div>}
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

    // 3. Fetch ALL shipments (including pending, for Bizum approval)
    const { data: shipments, error } = await supabaseAdmin
        .from("shipments")
        .select("*")
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
    const paidShipments = rows.filter(s => s.status !== 'pending_payment');
    const pendingShipments = rows.filter(s => s.status === 'pending_payment');

    // 4. Financial calculations
    const totalRevenue = paidShipments.reduce((acc, s) => acc + (s.final_price || 0), 0);
    const totalCost = paidShipments.reduce((acc, s) => acc + (s.cost_price || 0), 0);

    // Stripe fees (aprox 1.5% + 0.25€ per European transaction)
    const totalStripeFees = paidShipments.reduce((acc, s) => {
        if (s.stripe_session_id || s.stripe_payment_id) {
            return acc + ((s.final_price || 0) * 0.015 + 0.25);
        }
        return acc;
    }, 0);

    const totalProfit = totalRevenue - totalCost - totalStripeFees;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8 animate-fade-in">

            {/* ── Header ─────────────────────────────────────── */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="icon-badge icon-badge-purple">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Centro de Mando</h1>
                        <p className="text-sm text-white/40">Hola, {user.email}</p>
                    </div>
                </div>

                {pendingShipments.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <p className="text-sm text-amber-300 font-medium">
                            {pendingShipments.length} envío{pendingShipments.length > 1 ? 's' : ''} pendiente{pendingShipments.length > 1 ? 's' : ''} de cobro manual
                        </p>
                    </div>
                )}
            </header>

            {/* ── Metric Cards ───────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Ingresos Brutos"
                    value={`${totalRevenue.toFixed(2)} €`}
                    subtitle="Facturado a clientes"
                    icon={DollarSign}
                    accentColor="blue"
                />
                <MetricCard
                    title="Costes Operativos"
                    value={`${(totalCost + totalStripeFees).toFixed(2)} €`}
                    subtitle={`Logística: ${totalCost.toFixed(2)} €`}
                    icon={CreditCard}
                    accentColor="red"
                    extra={
                        <p className="text-[10px] text-white/25">
                            Stripe: {totalStripeFees.toFixed(2)} €
                        </p>
                    }
                />
                <MetricCard
                    title="Beneficio Real"
                    value={`+${totalProfit.toFixed(2)} €`}
                    subtitle={`Margen medio: ${avgMargin.toFixed(1)}%`}
                    icon={TrendingUp}
                    accentColor="green"
                />
                <MetricCard
                    title="Volumen Total"
                    value={`${paidShipments.length}`}
                    subtitle="Envíos completados"
                    icon={Package}
                    accentColor="purple"
                />
            </div>

            {/* ── Shipments Table ────────────────────────────── */}
            <div className="bento-card !p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.06]">
                    <h2 className="text-lg font-semibold text-white">Operaciones Recientes</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[11px] text-white/40 uppercase tracking-wider border-b border-white/[0.06]">
                                <th className="px-5 py-3 text-left font-medium">ID / Fecha</th>
                                <th className="px-5 py-3 text-left font-medium">Ruta</th>
                                <th className="px-5 py-3 text-right font-medium">Cobrado</th>
                                <th className="px-5 py-3 text-right font-medium">Coste API</th>
                                <th className="px-5 py-3 text-right font-medium">Pasarela</th>
                                <th className="px-5 py-3 text-right font-medium">Ganancia</th>
                                <th className="px-5 py-3 text-center font-medium">Estado</th>
                                <th className="px-5 py-3 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((shipment) => {
                                const isStripe = !!(shipment.stripe_session_id || shipment.stripe_payment_id);
                                const stripeFee = isStripe ? ((shipment.final_price || 0) * 0.015 + 0.25) : 0;
                                const profit = (shipment.final_price || 0) - (shipment.cost_price || 0) - stripeFee;
                                const profitMargin = shipment.final_price && shipment.final_price > 0
                                    ? (profit / shipment.final_price) * 100
                                    : 0;
                                const isPending = shipment.status === 'pending_payment';

                                return (
                                    <tr
                                        key={shipment.id}
                                        className={`border-b border-white/[0.04] transition-colors ${isPending
                                            ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.07]'
                                            : 'hover:bg-white/[0.03]'
                                            }`}
                                    >
                                        {/* ID / Date */}
                                        <td className="px-5 py-3.5">
                                            <div className="font-mono text-xs font-medium text-white/80">
                                                {shipment.id.split('-')[0].toUpperCase()}
                                            </div>
                                            <div className="text-[10px] text-white/25 mt-0.5">
                                                {new Date(shipment.created_at).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </td>

                                        {/* Route */}
                                        <td className="px-5 py-3.5">
                                            <div className="font-semibold text-white/80">
                                                {shipment.origin_data?.city || '—'} → {shipment.destination_data?.city || '—'}
                                            </div>
                                            <div className="text-[10px] text-white/25 font-mono mt-0.5">
                                                {shipment.api_provider?.toUpperCase() || '—'}
                                            </div>
                                        </td>

                                        {/* Revenue */}
                                        <td className="px-5 py-3.5 text-right font-medium text-white/80">
                                            {shipment.final_price?.toFixed(2) ?? '—'} €
                                        </td>

                                        {/* Cost */}
                                        <td className="px-5 py-3.5 text-right font-medium text-red-400/80">
                                            -{shipment.cost_price?.toFixed(2) ?? '—'} €
                                        </td>

                                        {/* Payment Gateway Fee */}
                                        <td className="px-5 py-3.5 text-right">
                                            {isPending ? (
                                                <span className="text-white/20">—</span>
                                            ) : (
                                                <>
                                                    <div className="font-medium text-orange-400/80">
                                                        -{stripeFee.toFixed(2)} €
                                                    </div>
                                                    <div className="text-[9px] text-white/20 mt-0.5">
                                                        {isStripe ? 'Stripe' : 'Manual (0%)'}
                                                    </div>
                                                </>
                                            )}
                                        </td>

                                        {/* Profit */}
                                        <td className="px-5 py-3.5 text-right">
                                            {isPending ? (
                                                <span className="text-white/20">—</span>
                                            ) : (
                                                <>
                                                    <div className={`font-bold ${profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {profit > 0 ? '+' : ''}{profit.toFixed(2)} €
                                                    </div>
                                                    <div className="text-[10px] text-white/25 mt-0.5">
                                                        {profitMargin.toFixed(0)}% mrg
                                                    </div>
                                                </>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-3.5 text-center">
                                            <StatusBadge status={shipment.status} />
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <form action={updateShipmentStatusAdmin} className="flex items-center gap-1">
                                                    <input type="hidden" name="shipmentId" value={shipment.id} />
                                                    <select
                                                        name="status"
                                                        defaultValue={shipment.status}
                                                        className="bg-black/20 border border-white/10 rounded-md text-xs text-white/80 py-1.5 px-2 outline-none focus:ring-1 focus:ring-emerald-500/50"
                                                    >
                                                        <option value="pending_payment">Pend. Pago</option>
                                                        <option value="paid">Pagado</option>
                                                        <option value="labels_generated">Etiqueta Lista</option>
                                                        <option value="in_transit">En Tránsito</option>
                                                        <option value="delivered">Entregado</option>
                                                        <option value="cancelled">Cancelado</option>
                                                    </select>
                                                    <button
                                                        type="submit"
                                                        title="Guardar estado"
                                                        className="p-1.5 rounded-md bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                    </button>
                                                </form>

                                                {isPending && (
                                                    <form action={approveManualPayment}>
                                                        <input type="hidden" name="shipmentId" value={shipment.id} />
                                                        <button
                                                            type="submit"
                                                            title="Aprobar pago"
                                                            className="inline-flex items-center justify-center p-1.5 rounded-md
                                                                bg-emerald-500/15 text-emerald-400 border border-emerald-500/25
                                                                hover:bg-emerald-500/25 transition-all cursor-pointer"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    </form>
                                                )}

                                                {shipment.status === 'labels_generated' && shipment.label_url && (
                                                    <a
                                                        href={shipment.label_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Ver Etiqueta PDF"
                                                        className="inline-flex items-center p-1.5 rounded-md
                                                            bg-blue-500/15 text-blue-400 border border-blue-500/25
                                                            hover:bg-blue-500/25 hover:text-blue-300 transition-all"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </a>
                                                )}

                                                <form action={deleteShipmentAdmin} onSubmit={(e) => {
                                                    if (!confirm('¿Seguro que deseas eliminar este envío? Esta acción no se puede deshacer.')) e.preventDefault();
                                                }}>
                                                    <input type="hidden" name="shipmentId" value={shipment.id} />
                                                    <button
                                                        type="submit"
                                                        title="Eliminar Envío"
                                                        className="p-1.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-white/30">
                                        <Package className="w-8 h-8 mx-auto mb-3 text-white/15" />
                                        Aún no hay operaciones registradas. ¡Pronto llegará el primer cliente!
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
