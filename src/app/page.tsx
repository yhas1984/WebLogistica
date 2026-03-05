'use client';

// ============================================================
// Landing Page — Hero + Social Proof + Funnel + Features + FAQ
// ============================================================

import { useRef, useEffect, useState } from 'react';
import {
  Truck,
  Shield,
  Zap,
  Globe,
  ArrowDown,
  Sparkles,
  BarChart3,
  ChevronDown,
  ArrowRight,
  Package,
  Users,
  Star,
} from 'lucide-react';
import { ShippingFunnel } from '@/components/shipping-funnel';

// ── Animated Counter ────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return <span ref={ref}>{count.toLocaleString('es-ES')}{suffix}</span>;
}

// ── FAQ Accordion Item ──────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bento-card !p-0 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <span className="text-sm font-medium text-white pr-4">{question}</span>
        <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <p className="px-6 pb-5 text-sm text-white/40 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// ── Scroll-reveal wrapper ───────────────────────────────────
function RevealOnScroll({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ── Carrier data ────────────────────────────────────────────
const CARRIERS = [
  { name: 'DHL', color: 'bg-yellow-500' },
  { name: 'SEUR', color: 'bg-red-500' },
  { name: 'UPS', color: 'bg-amber-700' },
  { name: 'FedEx', color: 'bg-purple-500' },
  { name: 'GLS', color: 'bg-blue-500' },
  { name: 'MRW', color: 'bg-red-600' },
  { name: 'Correos', color: 'bg-yellow-400' },
  { name: 'Nacex', color: 'bg-orange-500' },
];

const FAQS = [
  {
    question: '¿Cómo funciona la comparación de tarifas?',
    answer: 'Introduces las dimensiones de tu paquete y las direcciones de origen y destino. Consultamos en tiempo real a nuestros transportistas asociados (DHL, SEUR, UPS, FedEx, etc.) y te mostramos todas las opciones ordenadas por precio y tiempo de entrega.'
  },
  {
    question: '¿Es seguro pagar en WebLogistica?',
    answer: 'Absolutamente. Todos los pagos se procesan a través de Stripe, la plataforma de pagos más segura del mundo, con certificación PCI DSS Nivel 1. Nunca almacenamos datos de tu tarjeta.'
  },
  {
    question: '¿Puedo enviar paquetes internacionales?',
    answer: 'Sí, cubrimos envíos a más de 200 países. Para envíos fuera de la UE generamos automáticamente la documentación aduanera necesaria para que tu paquete llegue sin problemas.'
  },
  {
    question: '¿Cómo obtengo mi etiqueta de envío?',
    answer: 'Una vez confirmado el pago, generamos y te enviamos la etiqueta en PDF por email. También puedes descargarla desde tu panel "Mis Envíos". Solo imprímela y pégala en tu paquete.'
  },
  {
    question: '¿Qué pasa si mi paquete se pierde o daña?',
    answer: 'Todos nuestros envíos incluyen la cobertura básica del transportista. Si necesitas cobertura adicional, puedes contratar un seguro extra durante el proceso de compra.'
  },
  {
    question: '¿Puedo rastrear mi envío?',
    answer: 'Sí, desde el momento en que se genera la etiqueta recibirás un número de seguimiento. Puedes consultar el estado en tiempo real desde nuestra sección de "Rastrear" o directamente en la web del transportista.'
  },
];

// ============================================================
// Main Page Component
// ============================================================

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
        <p className="text-lg text-white/50 max-w-2xl mx-auto mb-8 animate-fade-in">
          Compara tarifas de DHL, SEUR, UPS, FedEx, Correos y más.
          Obtén hasta un <span className="text-emerald-400 font-semibold">40% de ahorro</span> en tus envíos
          nacionales e internacionales.
        </p>

        {/* CTA Button */}
        <div className="mb-12 animate-fade-in">
          <a
            href="#funnel"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white text-lg
                       bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600
                       hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500
                       shadow-[0_0_30px_rgba(99,102,241,0.3)]
                       hover:shadow-[0_0_50px_rgba(99,102,241,0.5)]
                       hover:scale-[1.03] active:scale-[0.98]
                       transition-all duration-300"
          >
            Cotizar Envío Gratis
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>

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

      {/* ── Social Proof — Stats + Carrier Logos ─────────── */}
      <RevealOnScroll>
        <section className="px-6 py-16 max-w-7xl mx-auto">
          {/* Stats Counter */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { icon: <Package className="w-5 h-5" />, value: 1200, suffix: '+', label: 'Envíos procesados', color: 'text-blue-400' },
              { icon: <Truck className="w-5 h-5" />, value: 50, suffix: '+', label: 'Transportistas', color: 'text-purple-400' },
              { icon: <Globe className="w-5 h-5" />, value: 200, suffix: '+', label: 'Países cubiertos', color: 'text-emerald-400' },
              { icon: <Users className="w-5 h-5" />, value: 98, suffix: '%', label: 'Satisfacción', color: 'text-amber-400' },
            ].map((stat, i) => (
              <div key={i} className="bento-card text-center !py-6">
                <div className={`${stat.color} mb-2 flex justify-center`}>{stat.icon}</div>
                <p className="text-3xl md:text-4xl font-bold text-white mb-1">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Carrier Logos Strip */}
          <div className="text-center mb-6">
            <p className="text-xs text-white/30 uppercase tracking-widest font-medium">Transportistas verificados</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {CARRIERS.map((carrier, i) => (
              <div
                key={carrier.name}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]
                           hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300"
              >
                <div className={`w-6 h-6 rounded-md ${carrier.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                  {carrier.name.charAt(0)}
                </div>
                <span className="text-xs text-white/50 font-medium">{carrier.name}</span>
              </div>
            ))}
          </div>
        </section>
      </RevealOnScroll>

      {/* ── Shipping Funnel (Wizard) ────────────────────────── */}
      <section id="funnel" className="relative z-10 scroll-mt-20">
        <ShippingFunnel />
      </section>

      {/* ── Features Grid ─────────────────────────────────── */}
      <section className="px-6 py-20 max-w-7xl mx-auto border-t border-white/5">
        <RevealOnScroll>
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-3">
              ¿Por qué WebLogistica?
            </h2>
            <p className="text-white/40 text-sm max-w-md mx-auto">
              La plataforma de logística más inteligente de Europa
            </p>
          </div>
        </RevealOnScroll>
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
            <RevealOnScroll key={i} delay={i * 80}>
              <div className="bento-card group hover:scale-[1.02] transition-transform duration-300">
                <div className={`icon-badge ${feat.color} mb-4 group-hover:scale-110 transition-transform`}>{feat.icon}</div>
                <h3 className="text-white font-semibold mb-2">{feat.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* ── Testimonial Strip ─────────────────────────────── */}
      <RevealOnScroll>
        <section className="px-6 py-16 max-w-5xl mx-auto">
          <div className="bento-card !p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" />
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <blockquote className="text-white/70 text-base md:text-lg italic mb-4 max-w-2xl mx-auto leading-relaxed">
              &ldquo;Pasamos de gestionar envíos manualmente a automatizar todo con WebLogistica.
              Ahorramos un 35% en costes de mensajería el primer mes.&rdquo;
            </blockquote>
            <p className="text-sm text-white/40">
              <span className="text-white/60 font-medium">María G.</span> — Ecommerce Manager, TiendaOnline.es
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* ── FAQ Section ───────────────────────────────────── */}
      <RevealOnScroll>
        <section id="faq" className="px-6 py-20 max-w-3xl mx-auto scroll-mt-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-3">Preguntas Frecuentes</h2>
            <p className="text-white/40 text-sm">
              Todo lo que necesitas saber sobre nuestro servicio
            </p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </section>
      </RevealOnScroll>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <RevealOnScroll>
        <section className="px-6 py-20 max-w-4xl mx-auto text-center">
          <div className="bento-card !p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-blue-600/10" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ¿Listo para enviar?
              </h2>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                Compara tarifas en tiempo real y ahorra hasta un 40% en tu próximo envío.
              </p>
              <a
                href="#funnel"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white text-lg
                           bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600
                           hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500
                           shadow-[0_0_30px_rgba(99,102,241,0.3)]
                           hover:shadow-[0_0_50px_rgba(99,102,241,0.5)]
                           hover:scale-[1.03] active:scale-[0.98]
                           transition-all duration-300"
              >
                Cotizar Ahora
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>
      </RevealOnScroll>
    </div>
  );
}
