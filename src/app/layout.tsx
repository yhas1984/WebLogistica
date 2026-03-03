import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/actions/auth';
import { LogOut } from 'lucide-react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'WebLogistica | Envíos Inteligentes al Mejor Precio',
  description:
    'Compara tarifas de envío de múltiples transportistas en tiempo real. DHL, SEUR, UPS, FedEx, Correos y más — encuentra el precio más bajo al instante.',
  keywords: ['envíos', 'logística', 'tarifas', 'transporte', 'paquetería', 'comparador'],
  openGraph: {
    title: 'WebLogistica — Agregador Logístico Global',
    description: 'El comparador de tarifas de envío más inteligente. Hasta un 40% de ahorro.',
    type: 'website',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        {/* Ambient Background */}
        <div className="bg-mesh" aria-hidden="true" />
        <div className="bg-grid" aria-hidden="true" />

        {/* Navigation */}
        <header className="fixed top-0 inset-x-0 z-50">
          <nav className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex items-center justify-between backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl px-6 py-3">
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
              <div className="hidden md:flex items-center gap-6">
                <a
                  href="/#quote"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Cotizar
                </a>
                <a
                  href="/tracking"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Rastrear
                </a>
                <a
                  href="/dashboard"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Mis Envíos
                </a>
              </div>

              <div className="flex items-center gap-3">
                {user ? (
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
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="relative pt-24 min-h-screen">{children}</main>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] mt-20">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-white/30">
                © 2026 WebLogistica. Todos los derechos reservados.
              </p>
              <div className="flex items-center gap-6 text-sm text-white/30">
                <a href="#" className="hover:text-white/60 transition-colors">
                  Privacidad
                </a>
                <a href="#" className="hover:text-white/60 transition-colors">
                  Términos
                </a>
                <a href="#" className="hover:text-white/60 transition-colors">
                  Soporte
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
