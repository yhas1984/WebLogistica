import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Package, Download, Truck, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Mis Envíos | WebLogistica',
    description: 'Gestiona y rastrea tus paquetes globales.',
};

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

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            <header className="mb-8 pl-2 border-l-4 border-blue-500">
                <h1 className="text-3xl font-bold text-white">Mis Envíos</h1>
                <p className="text-white/60 mt-1">Gestiona y rastrea tus paquetes globales.</p>
            </header>

            <div className="grid gap-6">
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
                    shipments.map((shipment) => {
                        return (
                            <div key={shipment.id} className="bento-card overflow-hidden border-l-4 border-l-blue-600 !p-0">
                                <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                                    <div className="bg-blue-500/10 p-4 rounded-full">
                                        <Package className="h-8 w-8 text-blue-500" />
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="font-bold text-lg text-white">
                                                {shipment.origin_data?.city || 'Origen'} → {shipment.destination_data?.city || 'Destino'}
                                            </span>

                                            {/* Status Badge */}
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${shipment.status === 'labels_generated'
                                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                    : shipment.status === 'paid'
                                                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                        : 'bg-white/10 text-white/70 border border-white/20'
                                                }`}>
                                                {shipment.status === 'labels_generated' ? 'Etiqueta Lista' :
                                                    shipment.status === 'paid' ? 'Pago Confirmado' : shipment.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-white/50 flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            {new Date(shipment.created_at).toLocaleDateString('es-ES', {
                                                day: 'numeric', month: 'long'
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                        {shipment.label_url ? (
                                            <a
                                                href={shipment.label_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex flex-1 sm:flex-none items-center justify-center rounded-md text-sm font-medium transition-colors bg-white text-black hover:bg-white/90 h-10 px-4 py-2 gap-2"
                                            >
                                                <Download className="h-4 w-4" />
                                                Descargar Etiqueta
                                            </a>
                                        ) : (
                                            <button
                                                disabled
                                                className="inline-flex flex-1 sm:flex-none items-center justify-center rounded-md text-sm font-medium transition-colors border border-white/10 bg-white/5 text-white/50 cursor-not-allowed h-10 px-4 py-2 gap-2"
                                            >
                                                <Truck className="h-4 w-4" />
                                                Procesando...
                                            </button>
                                        )}
                                        <Link
                                            href={`/tracking/${shipment.id}`}
                                            className="inline-flex flex-1 sm:flex-none items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-white/10 text-blue-400 hover:text-blue-300 h-10 px-4 py-2"
                                        >
                                            Detalles
                                        </Link>
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
