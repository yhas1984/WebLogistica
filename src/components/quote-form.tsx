'use client';

// ============================================================
// QuoteForm — Main Shipping Quote Form
// Bento Grid design with glassmorphism, Zod validation
// ============================================================

import { useState, useTransition, useEffect, useRef } from 'react';
import {
    Package,
    MapPin,
    Weight,
    Ruler,
    ArrowRight,
    Loader2,
    AlertTriangle,
} from 'lucide-react';
import { getRatesAction, type QuoteFormState } from '@/actions/get-rates';
import type { RateResultsData } from '@/types';
import { calculateBillableWeight } from '@/lib/pricing';

interface QuoteFormProps {
    onResults: (data: RateResultsData) => void;
    subdomainMarkup?: number;
}

export default function QuoteForm({ onResults, subdomainMarkup = 0 }: QuoteFormProps) {
    const [isPending, startTransition] = useTransition();
    const [formState, setFormState] = useState<QuoteFormState | null>(null);

    const [dimensions, setDimensions] = useState({ length: 30, width: 20, height: 15, weight: 2.5 });

    // Address state
    const [originAddress, setOriginAddress] = useState("");
    const [originPostalCode, setOriginPostalCode] = useState("");
    const [originCity, setOriginCity] = useState("");
    const [originCountry, setOriginCountry] = useState("ES");

    const [destAddress, setDestAddress] = useState("");
    const [destPostalCode, setDestPostalCode] = useState("");
    const [destCity, setDestCity] = useState("");
    const [destCountry, setDestCountry] = useState("ES");

    // Refs for GMP Components
    const originPickerRef = useRef<any>(null);
    const destPickerRef = useRef<any>(null);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        const extractPlaceData = (place: any) => {
            let postalCode = '';
            let city = '';
            let country = 'ES'; // Fallback
            for (const component of place.addressComponents || []) {
                const types = component.types;
                if (types.includes('postal_code')) {
                    postalCode = component.longText;
                }
                if (types.includes('locality') || types.includes('postal_town')) {
                    city = component.longText;
                }
                if (types.includes('country')) {
                    country = component.shortText;
                }
            }
            return { address: place.formattedAddress || place.displayName || '', postalCode, city, country };
        };

        const setupPicker = (pickerRef: any, setAddress: any, setPostalCode: any, setCountry: any, setCity: any) => {
            const handlePlaceChange = () => {
                const place = pickerRef.current?.value;
                if (!place) return;

                const data = extractPlaceData(place);
                setAddress(data.address);
                if (data.postalCode) setPostalCode(data.postalCode);
                if (data.city) setCity(data.city);
                if (data.country) setCountry(data.country);
            };

            const picker = pickerRef.current;
            if (picker) {
                picker.addEventListener('gmpx-placechange', handlePlaceChange);
            }
            return () => {
                if (picker) {
                    picker.removeEventListener('gmpx-placechange', handlePlaceChange);
                }
            };
        };

        // We delay the setup slightly to allow the web components to upgrade/mount
        const timeoutId = setTimeout(() => {
            setupPicker(originPickerRef, setOriginAddress, setOriginPostalCode, setOriginCountry, setOriginCity);
            setupPicker(destPickerRef, setDestAddress, setDestPostalCode, setDestCountry, setDestCity);
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [apiKey]);

    const billableWeight = calculateBillableWeight(dimensions);

    async function handleSubmit(formData: FormData) {
        formData.set('subdomainMarkup', String(subdomainMarkup));

        startTransition(async () => {
            const result = await getRatesAction(formData);
            setFormState(result);
            if (result.success && result.data) {
                onResults(result.data);
            }
        });
    }

    return (
        <form action={handleSubmit} className="w-full max-w-5xl mx-auto">
            {isMounted && (
                <div
                    dangerouslySetInnerHTML={{
                        __html: `<gmpx-api-loader key="${apiKey}" solution-channel="GMP_GE_mapsandplacesautocomplete_v2"></gmpx-api-loader>`
                    }}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* ── Origin Card ────────────────────────────────── */}
                <div className="bento-card col-span-1 flex flex-col h-auto">
                    <div className="flex items-center gap-2 mb-4 shrink-0">
                        <div className="icon-badge icon-badge-blue">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
                            Origen
                        </h3>
                    </div>

                    <div className="relative flex-grow">
                        {isMounted ? (
                            <div className="w-full">
                                <gmpx-place-picker ref={originPickerRef} placeholder="¿De dónde sale?" style={{ width: '100%' }}></gmpx-place-picker>
                            </div>
                        ) : (
                            <div className="w-full h-10 bg-white/5 animate-pulse flex items-center justify-center rounded-lg">
                                <Loader2 className="w-5 h-5 animate-spin text-white/20" />
                            </div>
                        )}
                        <input type="hidden" name="originPostalCode" value={originPostalCode} />
                        <input type="hidden" name="originCity" value={originCity} />
                        <input type="hidden" name="originCountry" value={originCountry} />
                    </div>
                    {(formState?.fieldErrors?.originPostalCode || formState?.fieldErrors?.originCountry) && (
                        <p className="form-error mt-2 shrink-0">Por favor busca y selecciona una dirección válida.</p>
                    )}
                </div>

                {/* ── Destination Card ───────────────────────────── */}
                <div className="bento-card col-span-1 flex flex-col h-auto">
                    <div className="flex items-center gap-2 mb-4 shrink-0">
                        <div className="icon-badge icon-badge-purple">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
                            Destino
                        </h3>
                    </div>

                    <div className="relative flex-grow">
                        {isMounted ? (
                            <div className="w-full">
                                <gmpx-place-picker ref={destPickerRef} placeholder="¿Hacia dónde va?" style={{ width: '100%' }}></gmpx-place-picker>
                            </div>
                        ) : (
                            <div className="w-full h-10 bg-white/5 animate-pulse flex items-center justify-center rounded-lg">
                                <Loader2 className="w-5 h-5 animate-spin text-white/20" />
                            </div>
                        )}
                        <input type="hidden" name="destinationPostalCode" value={destPostalCode} />
                        <input type="hidden" name="destinationCity" value={destCity} />
                        <input type="hidden" name="destinationCountry" value={destCountry} />
                    </div>
                    {(formState?.fieldErrors?.destinationPostalCode || formState?.fieldErrors?.destinationCountry) && (
                        <p className="form-error mt-2 shrink-0">Por favor busca y selecciona una dirección válida.</p>
                    )}
                </div>

                {/* ── Package Card ───────────────────────────────── */}
                <div className="bento-card col-span-1 md:col-span-2 lg:col-span-1 h-auto flex flex-col">
                    <div className="flex items-center gap-2 mb-4 shrink-0">
                        <div className="icon-badge icon-badge-amber">
                            <Package className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
                            Paquete
                        </h3>
                    </div>
                    <div className="space-y-4 flex-grow overflow-auto pr-2">
                        <div>
                            <label className="form-label" htmlFor="weight">
                                <Weight className="w-3 h-3 inline mr-1" />
                                Peso Real (kg)
                            </label>
                            <input
                                id="weight"
                                name="weight"
                                type="number"
                                step="0.1"
                                min="0.1"
                                required
                                value={dimensions.weight}
                                onChange={(e) => setDimensions({ ...dimensions, weight: +e.target.value })}
                                placeholder="2.5"
                                className="form-input"
                            />
                            {formState?.fieldErrors?.weight && (
                                <p className="form-error">{formState.fieldErrors.weight[0]}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="form-label" htmlFor="length">
                                    <Ruler className="w-3 h-3 inline mr-1" />L
                                </label>
                                <input
                                    id="length"
                                    name="length"
                                    type="number"
                                    step="1"
                                    min="1"
                                    required
                                    value={dimensions.length}
                                    onChange={(e) => setDimensions({ ...dimensions, length: +e.target.value })}
                                    placeholder="30"
                                    className="form-input"
                                />
                            </div>
                            <div>
                                <label className="form-label" htmlFor="width">
                                    A
                                </label>
                                <input
                                    id="width"
                                    name="width"
                                    type="number"
                                    step="1"
                                    min="1"
                                    required
                                    value={dimensions.width}
                                    onChange={(e) => setDimensions({ ...dimensions, width: +e.target.value })}
                                    placeholder="20"
                                    className="form-input"
                                />
                            </div>
                            <div>
                                <label className="form-label" htmlFor="height">
                                    H
                                </label>
                                <input
                                    id="height"
                                    name="height"
                                    type="number"
                                    step="1"
                                    min="1"
                                    required
                                    value={dimensions.height}
                                    onChange={(e) => setDimensions({ ...dimensions, height: +e.target.value })}
                                    placeholder="15"
                                    className="form-input"
                                />
                            </div>
                        </div>
                        {(formState?.fieldErrors?.length ||
                            formState?.fieldErrors?.width ||
                            formState?.fieldErrors?.height) && (
                                <p className="form-error">Las dimensiones deben ser mayores que 0</p>
                            )}

                        {billableWeight > dimensions.weight && (
                            <div className="mt-4 text-xs bg-amber-500/10 text-amber-300 p-3 rounded-lg border border-amber-500/20">
                                ⚠️ <strong>Aviso:</strong> Se aplicará peso volumétrico ({billableWeight.toFixed(2)} kg) debido al tamaño de la caja.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Global Error ────────────────────────────────── */}
            {formState && !formState.success && formState.error && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                    <p className="text-red-300 text-sm">{formState.error}</p>
                </div>
            )}

            {/* ── Submit Button ───────────────────────────────── */}
            <div className="mt-8 flex justify-center">
                <button
                    type="submit"
                    disabled={isPending}
                    className="group relative px-8 py-4 rounded-2xl font-semibold text-white overflow-hidden
                     bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600
                     hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-300 ease-out
                     shadow-[0_0_30px_rgba(99,102,241,0.3)]
                     hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]
                     hover:scale-[1.02] active:scale-[0.98]"
                >
                    <span className="relative z-10 flex items-center gap-2 text-lg">
                        {isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Buscando tarifas...
                            </>
                        ) : (
                            <>
                                Comparar Tarifas
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </span>
                </button>
            </div>
        </form>
    );
}
