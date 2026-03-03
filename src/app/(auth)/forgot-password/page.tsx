'use client';

import { forgotPassword } from '@/actions/auth';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Mail, Loader2, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(formData: FormData) {
        setError(null);
        setSuccess(false);
        startTransition(async () => {
            const result = await forgotPassword(formData);
            if (result?.error) {
                setError(result.error);
            } else if (result?.success) {
                setSuccess(true);
            }
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
                    Volver al login
                </Link>

                <div className="bento-card p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-4">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Recuperar Contraseña</h1>
                        <p className="text-white/40 text-sm mt-2 text-center">
                            Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                        </p>
                    </div>

                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">¡Correo enviado!</h2>
                            <p className="text-sm text-white/50">
                                Revisa tu bandeja de entrada (y la carpeta de spam) para encontrar el enlace de recuperación.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium mt-4 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Volver al login
                            </Link>
                        </div>
                    ) : (
                        <form action={handleSubmit} className="space-y-4">
                            <div>
                                <label className="form-label" htmlFor="email">
                                    Correo electrónico
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="tu@email.com"
                                    className="form-input"
                                    autoFocus
                                />
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
                                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-90 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    'Enviar enlace de recuperación'
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-sm text-white/40">
                            ¿Recordaste tu contraseña?{' '}
                            <Link
                                href="/login"
                                className="text-blue-400 hover:underline font-medium"
                            >
                                Inicia sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
