import { MapPin } from 'lucide-react';
import TrackingWidget from '@/components/tracking-widget';

import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Rastrear Envío | Seguimiento de Paquetes en WebLogistica',
    description: 'Rastrea el estado de tu envío en tiempo real. Introduce tu número de seguimiento (ej. WL123456) y conoce la ubicación exacta de tu paquete con DHL, SEUR, UPS y más.',
    keywords: ['seguimiento envíos', 'rastrear paquete', 'estado envío', 'tracking DHL', 'seguimiento SEUR', 'rastreo WebLogistica'],
    alternates: {
        canonical: '/tracking',
    },
    openGraph: {
        title: 'Rastrear Envío en Tiempo Real | WebLogistica',
        description: 'Conoce la ubicación exacta de tu paquete al instante con múltiples transportistas en un solo lugar.',
        url: 'https://weblogistica.vercel.app/tracking',
    }
};

export default function TrackingPage() {
    return (
        <div className="px-6 py-12 max-w-7xl mx-auto">
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    <h1 className="text-2xl font-bold text-white">Rastrear Envío</h1>
                </div>
                <p className="text-white/40 text-sm">
                    Introduce tu número de seguimiento para ver el estado de tu envío
                </p>
            </div>
            <TrackingWidget />
        </div>
    );
}
