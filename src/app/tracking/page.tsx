import { MapPin } from 'lucide-react';
import TrackingWidget from '@/components/tracking-widget';

export const metadata = {
    title: 'Rastrear Envío | WebLogistica',
    description: 'Rastrea tu envío en tiempo real con WebLogistica',
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
