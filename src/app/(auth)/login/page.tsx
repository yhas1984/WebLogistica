'use client';

import { login } from '@/actions/auth';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { LogIn, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setError(null);
        startTransition(async () => {
            const result = await login(formData);
            if (result?.error) {
                setError(result.error);
            }
        });
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="w-full max-w-md animate-fade-in">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver al inicio
                </Link>

                <div className="bento-card p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
                            <LogIn className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Inicia Sesión</h1>
                        <p className="text-white/40 text-sm mt-2 text-center">
                            Gestiona tus envíos y consulta tus tarifas guardadas
                        </p>
                    </div>

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
                            />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="password">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="form-input"
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
                            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Accediendo...
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-sm text-white/40">
                            ¿No tienes cuenta?{' '}
                            <Link
                                href="/register"
                                className="text-blue-400 hover:underline font-medium"
                            >
                                Regístrate gratis
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
