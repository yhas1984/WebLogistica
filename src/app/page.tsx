'use client';

// ============================================================
// Landing Page — Quote + Rate Comparison
// ============================================================

import {
  Truck,
  Shield,
  Zap,
  Globe,
  ArrowDown,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { ShippingFunnel } from '@/components/shipping-funnel';

export default function HomePage() {
  return (
    <div className="relative">
      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="px-6 pt-12 pb-16 max-w-7xl mx-auto text-center">
        {/* Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                        bg-white/[0.04] border border-white/[0.08] mb-8
                        animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-medium text-white/60">
            Compara +50 transportistas en tiempo real
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight
                       leading-[1.1] mb-6 animate-fade-in">
          <span className="text-white">Envíos al </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 animate-gradient">
            mejor precio
          </span>
          <br />
          <span className="text-white">en segundos</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10 animate-fade-in">
          Compara tarifas de DHL, SEUR, UPS, FedEx, Correos y más.
          Obtén hasta un <span className="text-emerald-400 font-semibold">40% de ahorro</span> en tus envíos
          nacionales e internacionales.
        </p>

        {/* Value Props */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
          {[
            { icon: <Zap className="w-4 h-4" />, text: 'Comparación instantánea', color: 'text-amber-400' },
            { icon: <Shield className="w-4 h-4" />, text: 'Pago seguro con Stripe', color: 'text-emerald-400' },
            { icon: <Globe className="w-4 h-4" />, text: 'Envíos internacionales', color: 'text-blue-400' },
          ].map((prop, i) => (
            <div
              key={i}
              className="flex items-center justify-center gap-2 py-3 px-4
                         rounded-xl bg-white/[0.03] border border-white/[0.06]
                         animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className={prop.color}>{prop.icon}</span>
              <span className="text-sm text-white/60">{prop.text}</span>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mb-8">
          <a href="#funnel" className="animate-float">
            <ArrowDown className="w-5 h-5 text-white/20" />
          </a>
        </div>
      </section>

      {/* ── Shipping Funnel (Wizard) ────────────────────────── */}
      <section id="funnel" className="relative z-10 scroll-mt-20">
        <ShippingFunnel />
      </section>

      {/* ── Features Grid ─────────────────────────────────── */}
      <section className="px-6 py-20 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">
            ¿Por qué WebLogistica?
          </h2>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            La plataforma de logística más inteligente de Europa
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: <BarChart3 className="w-5 h-5" />,
              title: 'Peso Volumétrico Inteligente',
              desc: 'Calculamos automáticamente el peso facturable (real vs volumétrico) para que siempre sepas el precio real.',
              color: 'icon-badge-blue',
            },
            {
              icon: <Shield className="w-5 h-5" />,
              title: 'Pago 100% Seguro',
              desc: 'Pagos procesados por Stripe. Tu dinero protegido con estándares PCI DSS nivel 1.',
              color: 'icon-badge-emerald',
            },
            {
              icon: <Globe className="w-5 h-5" />,
              title: 'Cobertura Global',
              desc: 'Envía a más de 200 países. Gestión de aduanas simplificada para envíos internacionales.',
              color: 'icon-badge-purple',
            },
            {
              icon: <Truck className="w-5 h-5" />,
              title: 'Multi-Transportista',
              desc: 'Comparamos DHL, SEUR, UPS, FedEx, GLS, MRW, Correos y muchos más en una sola búsqueda.',
              color: 'icon-badge-amber',
            },
            {
              icon: <Zap className="w-5 h-5" />,
              title: 'Etiquetas Instantáneas',
              desc: 'Tras el pago, generamos tu etiqueta de envío al instante. Sin esperas, sin trámites.',
              color: 'icon-badge-blue',
            },
            {
              icon: <Sparkles className="w-5 h-5" />,
              title: 'Rastreo en Tiempo Real',
              desc: 'Seguimiento unificado de todos tus envíos desde una sola pantalla, con notificaciones automáticas.',
              color: 'icon-badge-purple',
            },
          ].map((feat, i) => (
            <div
              key={i}
              className="bento-card"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`icon-badge ${feat.color} mb-4`}>{feat.icon}</div>
              <h3 className="text-white font-semibold mb-2">{feat.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
