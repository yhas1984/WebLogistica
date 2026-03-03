'use client';

import { resetPassword } from '@/actions/auth';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { KeyRound, Loader2, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    async function handleSubmit(formData: FormData) {
        setError(null);
        const password = formData.get('password') as string;
        const confirm = formData.get('confirm') as string;

        if (password !== confirm) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        startTransition(async () => {
            const result = await resetPassword(formData);
            if (result?.error) {
                setError(result.error);
            }
            // On success, the server action redirects to /dashboard
        });
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="w-full max-w-md animate-fade-in">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Ir al login
                </Link>

                <div className="bento-card p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                            <KeyRound className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Nueva Contraseña</h1>
                        <p className="text-white/40 text-sm mt-2 text-center">
                            Introduce tu nueva contraseña. Debe tener al menos 6 caracteres.
                        </p>
                    </div>

                    <form action={handleSubmit} className="space-y-4">
                        <div>
                            <label className="form-label" htmlFor="password">
                                Nueva contraseña
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    placeholder="••••••••"
                                    className="form-input pr-11"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors p-1"
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="form-label" htmlFor="confirm">
                                Confirmar contraseña
                            </label>
                            <div className="relative">
                                <input
                                    id="confirm"
                                    name="confirm"
                                    type={showConfirm ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    placeholder="••••••••"
                                    className="form-input pr-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors p-1"
                                    tabIndex={-1}
                                    aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                <p className="text-red-300 text-xs">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Establecer nueva contraseña'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
