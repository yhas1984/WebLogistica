'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
    MapPin,
    User,
    Phone,
    ArrowRight,
    ArrowLeft,
    Truck,
    Building2,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import type { Address, CarrierRate } from '@/types';

interface CheckoutDetailsFormProps {
    baseOrigin: Partial<Address>;
    baseDest: Partial<Address>;
    rateSelected: CarrierRate;
    onProceedToPayment: (origin: Address, dest: Address) => void;
    onBack?: () => void;
}

// Declare google maps types
declare global {
    interface Window {
        google: any;
        __googleMapsLoaded?: boolean;
    }
}

export function CheckoutDetailsForm({
    baseOrigin,
    baseDest,
    rateSelected,
    onProceedToPayment,
    onBack
}: CheckoutDetailsFormProps) {
    const [origin, setOrigin] = useState<Address>({
        name: '',
        phone: '',
        address: '',
        city: baseOrigin.city || '',
        postalCode: baseOrigin.postalCode || '',
        countryCode: baseOrigin.countryCode || '',
    });

    const [dest, setDest] = useState<Address>({
        name: '',
        phone: '',
        address: '',
        city: baseDest.city || '',
        postalCode: baseDest.postalCode || '',
        countryCode: baseDest.countryCode || '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const originInputRef = useRef<HTMLInputElement>(null);
    const destInputRef = useRef<HTMLInputElement>(null);
    const originAutocompleteRef = useRef<any>(null);
    const destAutocompleteRef = useRef<any>(null);

    // Load Google Maps script if not already loaded
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
        if (!apiKey) return;

        // Check if already loaded
        if (window.google?.maps?.places) {
            initAutocomplete();
            return;
        }

        // Check if script tag already exists
        if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
            // Wait for it to load
            const checkInterval = setInterval(() => {
                if (window.google?.maps?.places) {
                    clearInterval(checkInterval);
                    initAutocomplete();
                }
            }, 200);
            return () => clearInterval(checkInterval);
        }

        // Load the script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            initAutocomplete();
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup autocomplete listeners
            if (originAutocompleteRef.current) {
                window.google?.maps?.event?.clearInstanceListeners(originAutocompleteRef.current);
            }
            if (destAutocompleteRef.current) {
                window.google?.maps?.event?.clearInstanceListeners(destAutocompleteRef.current);
            }
        };
    }, []);

    const initAutocomplete = useCallback(() => {
        if (!window.google?.maps?.places) return;

        // Origin autocomplete
        if (originInputRef.current && !originAutocompleteRef.current) {
            originAutocompleteRef.current = new window.google.maps.places.Autocomplete(
                originInputRef.current,
                {
                    types: ['address'],
                    fields: ['formatted_address', 'address_components', 'geometry'],
                }
            );

            originAutocompleteRef.current.addListener('place_changed', () => {
                const place = originAutocompleteRef.current.getPlace();
                if (!place?.address_components) return;

                const extracted = extractAddressComponents(place);
                setOrigin(prev => ({
                    ...prev,
                    address: place.formatted_address || '',
                    city: extracted.city || prev.city,
                    postalCode: extracted.postalCode || prev.postalCode,
                    countryCode: extracted.countryCode || prev.countryCode,
                }));
            });
        }

        // Destination autocomplete
        if (destInputRef.current && !destAutocompleteRef.current) {
            destAutocompleteRef.current = new window.google.maps.places.Autocomplete(
                destInputRef.current,
                {
                    types: ['address'],
                    fields: ['formatted_address', 'address_components', 'geometry'],
                }
            );

            destAutocompleteRef.current.addListener('place_changed', () => {
                const place = destAutocompleteRef.current.getPlace();
                if (!place?.address_components) return;

                const extracted = extractAddressComponents(place);
                setDest(prev => ({
                    ...prev,
                    address: place.formatted_address || '',
                    city: extracted.city || prev.city,
                    postalCode: extracted.postalCode || prev.postalCode,
                    countryCode: extracted.countryCode || prev.countryCode,
                }));
            });
        }
    }, []);

    function extractAddressComponents(place: any) {
        let city = '';
        let postalCode = '';
        let countryCode = '';

        for (const component of place.address_components || []) {
            const types = component.types as string[];
            if (types.includes('locality') || types.includes('postal_town')) {
                city = component.long_name;
            }
            if (types.includes('postal_code')) {
                postalCode = component.long_name;
            }
            if (types.includes('country')) {
                countryCode = component.short_name;
            }
        }

        return { city, postalCode, countryCode };
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!origin.name || !origin.phone || !origin.address || !dest.name || !dest.phone || !dest.address) {
            alert('Por favor, rellena todos los campos obligatorios para el mensajero.');
            return;
        }
        setIsSubmitting(true);
        onProceedToPayment(origin, dest);
    };

    const inputClasses = (color: string) =>
        `w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-${color}-500/50 focus:ring-1 focus:ring-${color}-500/20 transition-all`;

    return (
        <div className="max-w-5xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Info */}
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-2">Detalles del Envío</h2>
                <p className="text-white/60">Completa la información exacta para el mensajero antes del pago</p>

                <div className="mt-8 inline-flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Servicio</span>
                        <span className="text-blue-400 font-semibold">{rateSelected.carrierName} — {rateSelected.serviceName}</span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2">
                        {rateSelected.serviceType === 'door_to_door' ? (
                            <div className="flex items-center gap-2 text-emerald-400">
                                <Truck className="w-4 h-4" />
                                <span className="text-sm font-medium">Recogida a domicilio</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-amber-400">
                                <Building2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Dejar en punto</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                    {/* ORIGIN CARD */}
                    <div className="bento-card relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        <div className="flex items-center gap-2 mb-6 text-blue-400">
                            <MapPin className="w-5 h-5" />
                            <h3 className="font-bold uppercase tracking-widest text-sm">Recogida (Remitente)</h3>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-semibold text-white/40 uppercase pl-1">
                                    <User className="w-3 h-3" /> Nombre y Apellidos
                                </label>
                                <input
                                    required
                                    className={inputClasses('blue')}
                                    value={origin.name}
                                    onChange={e => setOrigin({ ...origin, name: e.target.value })}
                                    placeholder="Juan Pérez"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-semibold text-white/40 uppercase pl-1">
                                    <Phone className="w-3 h-3" /> Teléfono de contacto
                                </label>
                                <input
                                    required
                                    type="tel"
                                    className={inputClasses('blue')}
                                    value={origin.phone}
                                    onChange={e => setOrigin({ ...origin, phone: e.target.value })}
                                    placeholder="+34 600 000 000"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-semibold text-white/40 uppercase pl-1">
                                    <MapPin className="w-3 h-3" /> Dirección Completa
                                </label>
                                <input
                                    ref={originInputRef}
                                    required
                                    className={inputClasses('blue')}
                                    value={origin.address}
                                    onChange={e => setOrigin({ ...origin, address: e.target.value })}
                                    placeholder="Busca tu dirección..."
                                    autoComplete="off"
                                />
                                <div className="flex gap-2 mt-2 px-1">
                                    {origin.postalCode && (
                                        <span className="text-[10px] text-blue-400/60 bg-blue-500/10 px-2 py-0.5 rounded font-medium">
                                            CP {origin.postalCode}
                                        </span>
                                    )}
                                    {origin.city && (
                                        <span className="text-[10px] text-blue-400/60 bg-blue-500/10 px-2 py-0.5 rounded uppercase font-medium">
                                            {origin.city}
                                        </span>
                                    )}
                                    {origin.countryCode && (
                                        <span className="text-[10px] text-blue-400/60 bg-blue-500/10 px-2 py-0.5 rounded uppercase font-medium">
                                            {origin.countryCode}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DESTINATION CARD */}
                    <div className="bento-card relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                        <div className="flex items-center gap-2 mb-6 text-purple-400">
                            <Truck className="w-5 h-5" />
                            <h3 className="font-bold uppercase tracking-widest text-sm">Entrega (Destinatario)</h3>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-semibold text-white/40 uppercase pl-1">
                                    <User className="w-3 h-3" /> Nombre del Destinatario
                                </label>
                                <input
                                    required
                                    className={inputClasses('purple')}
                                    value={dest.name}
                                    onChange={e => setDest({ ...dest, name: e.target.value })}
                                    placeholder="María García"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-semibold text-white/40 uppercase pl-1">
                                    <Phone className="w-3 h-3" /> Teléfono Destino
                                </label>
                                <input
                                    required
                                    type="tel"
                                    className={inputClasses('purple')}
                                    value={dest.phone}
                                    onChange={e => setDest({ ...dest, phone: e.target.value })}
                                    placeholder="+34 600 000 000"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-semibold text-white/40 uppercase pl-1">
                                    <MapPin className="w-3 h-3" /> Dirección de Destino
                                </label>
                                <input
                                    ref={destInputRef}
                                    required
                                    className={inputClasses('purple')}
                                    value={dest.address}
                                    onChange={e => setDest({ ...dest, address: e.target.value })}
                                    placeholder="Busca la dirección de destino..."
                                    autoComplete="off"
                                />
                                <div className="flex gap-2 mt-2 px-1">
                                    {dest.postalCode && (
                                        <span className="text-[10px] text-purple-400/60 bg-purple-500/10 px-2 py-0.5 rounded font-medium">
                                            CP {dest.postalCode}
                                        </span>
                                    )}
                                    {dest.city && (
                                        <span className="text-[10px] text-purple-400/60 bg-purple-500/10 px-2 py-0.5 rounded uppercase font-medium">
                                            {dest.city}
                                        </span>
                                    )}
                                    {dest.countryCode && (
                                        <span className="text-[10px] text-purple-400/60 bg-purple-500/10 px-2 py-0.5 rounded uppercase font-medium">
                                            {dest.countryCode}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a tarifas
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white text-black font-bold text-lg 
                        hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(255,255,255,0.1)]
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-6 h-6" />
                                Pagar {rateSelected.finalPrice.toFixed(2)}€
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
