'use client';

// ============================================================
// QuoteForm — Main Shipping Quote Form
// Bento Grid design with glassmorphism, Zod validation
// ============================================================

import { useState, useTransition } from 'react';
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

interface QuoteFormProps {
    onResults: (data: RateResultsData) => void;
    subdomainMarkup?: number;
}

export default function QuoteForm({ onResults, subdomainMarkup = 0 }: QuoteFormProps) {
    const [isPending, startTransition] = useTransition();
    const [formState, setFormState] = useState<QuoteFormState | null>(null);

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
        <form action={handleSubmit} className="w-full max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* ── Origin Card ────────────────────────────────── */}
                <div className="bento-card col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="icon-badge icon-badge-blue">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
                            Origen
                        </h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="form-label" htmlFor="originPostalCode">
                                Código Postal
                            </label>
                            <input
                                id="originPostalCode"
                                name="originPostalCode"
                                type="text"
                                required
                                placeholder="28001"
                                className="form-input"
                            />
                            {formState?.fieldErrors?.originPostalCode && (
                                <p className="form-error">{formState.fieldErrors.originPostalCode[0]}</p>
                            )}
                        </div>
                        <div>
                            <label className="form-label" htmlFor="originCountry">
                                País
                            </label>
                            <select
                                id="originCountry"
                                name="originCountry"
                                defaultValue="ES"
                                className="form-input"
                            >
                                <option value="ES">🇪🇸 España</option>
                                <option value="FR">🇫🇷 Francia</option>
                                <option value="DE">🇩🇪 Alemania</option>
                                <option value="IT">🇮🇹 Italia</option>
                                <option value="PT">🇵🇹 Portugal</option>
                                <option value="GB">🇬🇧 Reino Unido</option>
                                <option value="US">🇺🇸 Estados Unidos</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Destination Card ───────────────────────────── */}
                <div className="bento-card col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="icon-badge icon-badge-purple">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
                            Destino
                        </h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="form-label" htmlFor="destinationPostalCode">
                                Código Postal
                            </label>
                            <input
                                id="destinationPostalCode"
                                name="destinationPostalCode"
                                type="text"
                                required
                                placeholder="08001"
                                className="form-input"
                            />
                            {formState?.fieldErrors?.destinationPostalCode && (
                                <p className="form-error">
                                    {formState.fieldErrors.destinationPostalCode[0]}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="form-label" htmlFor="destinationCountry">
                                País
                            </label>
                            <select
                                id="destinationCountry"
                                name="destinationCountry"
                                defaultValue="ES"
                                className="form-input"
                            >
                                <option value="ES">🇪🇸 España</option>
                                <option value="FR">🇫🇷 Francia</option>
                                <option value="DE">🇩🇪 Alemania</option>
                                <option value="IT">🇮🇹 Italia</option>
                                <option value="PT">🇵🇹 Portugal</option>
                                <option value="GB">🇬🇧 Reino Unido</option>
                                <option value="US">🇺🇸 Estados Unidos</option>
                                <option value="VE">🇻🇪 Venezuela</option>
                                <option value="CO">🇨🇴 Colombia</option>
                                <option value="MX">🇲🇽 México</option>
                                <option value="AR">🇦🇷 Argentina</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Package Card ───────────────────────────────── */}
                <div className="bento-card col-span-1 md:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="icon-badge icon-badge-amber">
                            <Package className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
                            Paquete
                        </h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="form-label" htmlFor="weight">
                                <Weight className="w-3 h-3 inline mr-1" />
                                Peso (kg)
                            </label>
                            <input
                                id="weight"
                                name="weight"
                                type="number"
                                step="0.1"
                                min="0.1"
                                required
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
            <div className="mt-6 flex justify-center">
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
