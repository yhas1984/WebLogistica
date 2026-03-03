import { CheckCircle2, ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Pago Completado | WebLogistica',
};

export default function CheckoutSuccessPage() {
    return (
        <div className="px-6 py-20 max-w-2xl mx-auto text-center">
            <div className="bento-card animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">¡Pago completado!</h1>
                <p className="text-white/50 mb-8">
                    Tu envío ha sido procesado correctamente. Estamos generando tu etiqueta de envío.
                    Recibirás un email con el enlace de descarga en breve.
                </p>
                <a
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                     bg-gradient-to-r from-blue-600 to-purple-600
                     text-white font-medium text-sm hover:opacity-90 transition-opacity"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Ver Mis Envíos
                </a>
            </div>
        </div>
    );
}
