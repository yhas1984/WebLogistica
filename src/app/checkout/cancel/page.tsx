import { XCircle, ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Pago Cancelado | WebLogistica',
};

export default function CheckoutCancelPage() {
    return (
        <div className="px-6 py-20 max-w-2xl mx-auto text-center">
            <div className="bento-card animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Pago cancelado</h1>
                <p className="text-white/50 mb-8">
                    No se ha realizado ningún cargo. Puedes volver a intentarlo cuando quieras.
                </p>
                <a
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                     bg-gradient-to-r from-blue-600 to-purple-600
                     text-white font-medium text-sm hover:opacity-90 transition-opacity"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Cotizar
                </a>
            </div>
        </div>
    );
}
