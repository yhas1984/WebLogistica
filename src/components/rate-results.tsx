'use client';

// ============================================================
// RateResults — Bento Grid Rate Comparison Cards
// ============================================================

import {
    Truck,
    Zap,
    BadgeDollarSign,
    Clock,
    ArrowRight,
    Sparkles,
    TrendingDown,
    Package,
    Info,
} from 'lucide-react';
import type { RateResultsData, CarrierRate, ParcelWithVolumetric } from '@/types';

interface RateResultsProps {
    data: RateResultsData;
    onSelectRate: (rate: CarrierRate) => void;
}

// Carrier logos / brand colors
const CARRIER_COLORS: Record<string, string> = {
    'DHL Express': 'from-yellow-500 to-yellow-600',
    'SEUR': 'from-red-500 to-red-600',
    'Correos': 'from-yellow-400 to-amber-500',
    'UPS': 'from-amber-600 to-amber-700',
    'GLS': 'from-blue-500 to-blue-600',
    'FedEx': 'from-purple-500 to-indigo-600',
    'MRW': 'from-red-600 to-red-700',
};

function getCarrierGradient(carrierName: string): string {
    return CARRIER_COLORS[carrierName] || 'from-gray-500 to-gray-600';
}

function ParcelInfoBadge({ parcel }: { parcel: ParcelWithVolumetric }) {
    const isVolumetric = parcel.volumetricWeight > parcel.weight;

    return (
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-white/70 uppercase tracking-wider">
                    Peso facturado
                </span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                    {parcel.billableWeight} kg
                </span>
                {isVolumetric && (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Peso volumétrico aplicado ({parcel.weight} kg real → {parcel.volumetricWeight} kg vol.)
                    </span>
                )}
            </div>
        </div>
    );
}

export default function RateResults({ data, onSelectRate }: RateResultsProps) {
    const { rates, cheapest, fastest, parcel, errors } = data;

    if (rates.length === 0) {
        return (
            <div className="text-center py-12">
                <Truck className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg">No se encontraron tarifas disponibles</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto mt-8 animate-fade-in">
            {/* Parcel Info */}
            <ParcelInfoBadge parcel={parcel} />

            {/* Error warnings (non-fatal) */}
            {errors.length > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-amber-300 text-xs">
                        ⚠️ Algunos proveedores no respondieron: {errors.join(', ')}
                    </p>
                </div>
            )}

            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    {rates.length} tarifa{rates.length !== 1 ? 's' : ''} encontrada{rates.length !== 1 ? 's' : ''}
                </h2>
            </div>

            {/* Rate Cards — Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rates.map((rate) => {
                    const isCheapest = cheapest?.id === rate.id;
                    const isFastest = fastest?.id === rate.id && !isCheapest;

                    return (
                        <div
                            key={rate.id}
                            className={`
                bento-card group cursor-pointer transition-all duration-300
                hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]
                ${isCheapest ? 'ring-2 ring-emerald-500/50' : ''}
                ${isFastest ? 'ring-2 ring-blue-500/50' : ''}
              `}
                            onClick={() => onSelectRate(rate)}
                        >
                            {/* Badges */}
                            <div className="flex gap-2 mb-3">
                                {isCheapest && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                        <TrendingDown className="w-3 h-3" />
                                        Más barato
                                    </span>
                                )}
                                {isFastest && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                                        <Zap className="w-3 h-3" />
                                        Más rápido
                                    </span>
                                )}
                            </div>

                            {/* Carrier */}
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getCarrierGradient(rate.carrierName)}
                    flex items-center justify-center text-white font-bold text-sm shadow-lg`}
                                >
                                    {rate.carrierName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-white text-sm">
                                        {rate.carrierName}
                                    </p>
                                    <p className="text-xs text-white/50">{rate.serviceName}</p>
                                </div>
                            </div>

                            {/* Price & Delivery */}
                            <div className="flex items-end justify-between mt-auto pt-4 border-t border-white/5">
                                <div>
                                    <p className="text-xs text-white/40 mb-0.5 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {rate.estimatedDays} día{rate.estimatedDays !== 1 ? 's' : ''}
                                    </p>
                                    <p className="text-xs text-white/30 capitalize">{rate.provider}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-white flex items-baseline gap-0.5">
                                        <BadgeDollarSign className="w-4 h-4 text-white/40" />
                                        {rate.finalPrice.toFixed(2)}
                                        <span className="text-xs text-white/40 font-normal ml-0.5">€</span>
                                    </p>
                                </div>
                            </div>

                            {/* Hover CTA */}
                            <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="flex items-center justify-center gap-2 text-xs text-purple-300 font-medium">
                                    Seleccionar
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
