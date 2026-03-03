'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Check,
    ChevronRight,
    Package,
    Truck,
    CreditCard,
    ArrowLeft,
    Loader2,
    AlertCircle
} from 'lucide-react';
import QuoteForm from '@/components/quote-form';
import RateResults from '@/components/rate-results';
import { CheckoutDetailsForm } from '@/components/checkout-details-form';
import type { RateResultsData, CarrierRate, Address } from '@/types';

// ============================================================
// ShippingFunnel — Multi-step Shipping Wizard
// ============================================================

export function ShippingFunnel() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [rateResults, setRateResults] = useState<RateResultsData | null>(null);
    const [selectedRate, setSelectedRate] = useState<CarrierRate | null>(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    // Scroll to top of funnel on step change
    useEffect(() => {
        if (containerRef.current) {
            const yOffset = -100;
            const element = containerRef.current;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    }, [step]);

    const handleQuoteResults = (data: RateResultsData) => {
        setRateResults(data);
        setSelectedRate(null);
        setError(null);
        setStep(2);
    };

    const handleSelectRate = (rate: CarrierRate) => {
        setSelectedRate(rate);
        setStep(3);
    };

    const handleBackToRates = () => {
        setStep(2);
        setSelectedRate(null);
    };

    const handleBackToQuote = () => {
        setStep(1);
        setRateResults(null);
        setSelectedRate(null);
    };

    const handleProceedToPayment = async (origin: Address, dest: Address) => {
        if (!selectedRate || !rateResults) return;

        setIsCheckingOut(true);
        setError(null);

        try {
            const { createCheckoutSession } = await import('@/actions/checkout');
            const result = await createCheckoutSession(
                selectedRate.id,
                {
                    ...selectedRate,
                    dimensions: rateResults.parcel
                },
                origin,
                dest
            );

            if (result?.error) {
                if (result.error.includes('iniciar sesión')) {
                    // Guardamos el estado actual si es posible o simplemente redirigimos
                    // Para esta v1, redirigimos directamente
                    router.push('/login');
                } else {
                    setError(result.error);
                    setIsCheckingOut(false);
                }
            }
            // Note: redirect is handled inside createCheckoutSession via next/navigation
        } catch (err: any) {
            console.error('[ShippingFunnel] Checkout Error:', err);
            setError('Ocurrió un error inesperado al procesar el pago.');
            setIsCheckingOut(false);
        }
    };

    const steps = [
        { id: 1, name: 'Presupuesto', icon: Package },
        { id: 2, name: 'Transportista', icon: Truck },
        { id: 3, name: 'Detalles y Pago', icon: CreditCard },
    ];

    return (
        <div ref={containerRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* ── Progress Stepper ───────────────────────────────── */}
            <div className="mb-12">
                <div className="flex items-center justify-center max-w-2xl mx-auto">
                    {steps.map((s, i) => (
                        <div key={s.id} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center relative">
                                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${step >= s.id
                                        ? 'bg-indigo-500 border-indigo-500 text-white'
                                        : 'bg-white/5 border-white/10 text-white/40'}
                  ${step === s.id ? 'ring-4 ring-indigo-500/20' : ''}
                `}>
                                    {step > s.id ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <s.icon className="w-5 h-5" />
                                    )}
                                </div>
                                <span className={`
                  absolute -bottom-7 whitespace-nowrap text-xs font-medium transition-colors
                  ${step >= s.id ? 'text-indigo-400' : 'text-white/30'}
                `}>
                                    {s.name}
                                </span>
                            </div>

                            {i < steps.length - 1 && (
                                <div className="flex-1 h-[2px] mx-4 bg-white/10 overflow-hidden">
                                    <div className={`
                    h-full bg-indigo-500 transition-all duration-700 ease-in-out
                    ${step > s.id ? 'w-full' : 'w-0'}
                  `} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Error Alert ────────────────────────────────────── */}
            {error && (
                <div className="max-w-3xl mx-auto mb-8 animate-fade-in">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* ── Funnel Content ─────────────────────────────────── */}
            <div className="transition-all duration-300">
                {step === 1 && (
                    <div className="animate-fade-in">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Comienza tu envío</h2>
                            <p className="text-white/40 text-sm">Introduce las dimensiones y el destino para obtener las mejores tarifas</p>
                        </div>
                        <QuoteForm onResults={handleQuoteResults} />
                    </div>
                )}

                {step === 2 && rateResults && (
                    <div className="animate-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Elige la mejor opción</h2>
                                <p className="text-white/40 text-sm">
                                    {rateResults.rates.length} tarifas encontradas para su envío de {rateResults.parcel.weight}kg
                                </p>
                            </div>
                            <button
                                onClick={handleBackToQuote}
                                className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Modificar búsqueda
                            </button>
                        </div>
                        <RateResults data={rateResults} onSelectRate={handleSelectRate} />
                    </div>
                )}

                {step === 3 && selectedRate && rateResults && (
                    <div className="animate-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Detalles finales</h2>
                                <p className="text-white/40 text-sm">
                                    Confirmando envío con <span className="text-indigo-400">{selectedRate.carrierName}</span>
                                </p>
                            </div>
                            <button
                                onClick={handleBackToRates}
                                className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                                disabled={isCheckingOut}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Cambiar transportista
                            </button>
                        </div>

                        <CheckoutDetailsForm
                            baseOrigin={{
                                postalCode: rateResults.searchParams.origin.postalCode,
                                city: rateResults.searchParams.origin.city,
                                countryCode: rateResults.searchParams.origin.country
                            }}
                            baseDest={{
                                postalCode: rateResults.searchParams.destination.postalCode,
                                city: rateResults.searchParams.destination.city,
                                countryCode: rateResults.searchParams.destination.country
                            }}
                            rateSelected={selectedRate}
                            onProceedToPayment={handleProceedToPayment}
                            onBack={handleBackToRates}
                        />
                    </div>
                )}
            </div>

            {/* ── Loading Overlay (Checkout) ────────────────────── */}
            {isCheckingOut && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="flex flex-col items-center gap-4 text-center px-6">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20" />
                            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin absolute inset-0" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Preparando tu pago</h3>
                        <p className="text-white/40 text-sm max-w-[280px]">
                            Estamos comunicándonos con Stripe para crear una sesión de pago segura...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
