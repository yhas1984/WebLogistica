'use client';

// ============================================================
// Navbar — Responsive with hamburger menu
// Client component to handle mobile toggle state
// ============================================================

import { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { logout } from '@/actions/auth';

interface NavbarProps {
    isLoggedIn: boolean;
}

export function Navbar({ isLoggedIn }: NavbarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    const navLinks = [
        { href: '/#funnel', label: 'Cotizar' },
        { href: '/tracking', label: 'Rastrear' },
        { href: '/dashboard', label: 'Mis Envíos' },
    ];

    return (
        <header className="fixed top-0 inset-x-0 z-50">
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-3">
                    {/* Logo */}
                    <a href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold text-white tracking-tight">
                            Web<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Logistica</span>
                        </span>
                    </a>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="text-sm text-white/60 hover:text-white transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop Auth + Mobile Toggle */}
                    <div className="flex items-center gap-3">
                        {/* Auth button (desktop) */}
                        <div className="hidden md:block">
                            {isLoggedIn ? (
                                <form action={logout}>
                                    <button
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/60
                                                   hover:text-white hover:bg-white/[0.06] transition-all"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Salir
                                    </button>
                                </form>
                            ) : (
                                <a
                                    href="/login"
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-white
                                               bg-white/[0.06] border border-white/[0.08]
                                               hover:bg-white/[0.1] transition-all"
                                >
                                    Acceder
                                </a>
                            )}
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
                            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu panel */}
                <div
                    className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${mobileOpen ? 'max-h-80 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
                        }`}
                >
                    <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 space-y-1">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className="block px-4 py-3 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-all"
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className="pt-2 border-t border-white/[0.06]">
                            {isLoggedIn ? (
                                <form action={logout}>
                                    <button
                                        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-white/60
                                                   hover:text-white hover:bg-white/[0.06] transition-all"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Cerrar sesión
                                    </button>
                                </form>
                            ) : (
                                <a
                                    href="/login"
                                    className="block text-center px-4 py-3 rounded-xl text-sm font-medium text-white
                                               bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-all"
                                >
                                    Acceder
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
}
