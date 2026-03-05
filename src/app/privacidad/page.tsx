import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Política de Privacidad | WebLogistica',
    description: 'Política de privacidad y protección de datos de WebLogistica.',
};

export default function PrivacidadPage() {
    return (
        <div className="px-6 py-12 max-w-3xl mx-auto">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors group text-sm"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Volver al inicio
            </Link>

            <div className="bento-card p-8 md:p-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="icon-badge icon-badge-emerald">
                        <Shield className="w-5 h-5" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Política de Privacidad</h1>
                </div>

                <div className="space-y-8 text-sm text-white/50 leading-relaxed">
                    <p className="text-white/60">
                        Última actualización: 5 de marzo de 2026
                    </p>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">1. Responsable del Tratamiento</h2>
                        <p>
                            WebLogistica (en adelante, "nosotros" o "la Plataforma") es responsable del tratamiento de los datos personales
                            que nos proporcionas al utilizar nuestros servicios de comparación y contratación de envíos.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">2. Datos que Recopilamos</h2>
                        <p className="mb-3">Recopilamos los siguientes tipos de datos personales:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-white/70">Datos de registro:</strong> nombre, dirección de correo electrónico y contraseña cifrada.</li>
                            <li><strong className="text-white/70">Datos de envío:</strong> direcciones de origen y destino, dimensiones del paquete, nombre y teléfono del remitente y destinatario.</li>
                            <li><strong className="text-white/70">Datos de pago:</strong> procesados íntegramente por Stripe. No almacenamos datos de tarjeta de crédito en nuestros servidores.</li>
                            <li><strong className="text-white/70">Datos de uso:</strong> páginas visitadas, interacciones con el servicio y datos técnicos del navegador.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">3. Finalidad del Tratamiento</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Gestionar tu cuenta y autenticación.</li>
                            <li>Procesar cotizaciones y contrataciones de envío.</li>
                            <li>Generar etiquetas de envío y facilitar el seguimiento de paquetes.</li>
                            <li>Enviarte notificaciones relacionadas con tus envíos (confirmaciones, etiquetas, actualizaciones de estado).</li>
                            <li>Mejorar nuestros servicios mediante análisis agregados de uso.</li>
                            <li>Proporcionar soporte al cliente a través de nuestro asistente virtual (LogiBot).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">4. Base Legal</h2>
                        <p>
                            El tratamiento de tus datos se fundamenta en: (a) la ejecución del contrato de servicios (cotización y envío),
                            (b) tu consentimiento para comunicaciones opcionales, (c) nuestro interés legítimo en mejorar la plataforma,
                            y (d) el cumplimiento de obligaciones legales aplicables.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">5. Compartición de Datos</h2>
                        <p className="mb-3">Compartimos tus datos únicamente con:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-white/70">Transportistas:</strong> (DHL, SEUR, UPS, FedEx, Correos, etc.) los datos necesarios para gestionar tu envío.</li>
                            <li><strong className="text-white/70">Stripe:</strong> para el procesamiento seguro de pagos.</li>
                            <li><strong className="text-white/70">Supabase:</strong> como proveedor de infraestructura de base de datos y autenticación.</li>
                            <li><strong className="text-white/70">Google:</strong> para servicios de autocompletado de direcciones (Google Maps).</li>
                        </ul>
                        <p className="mt-3">No vendemos tus datos personales a terceros bajo ninguna circunstancia.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">6. Seguridad</h2>
                        <p>
                            Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos: cifrado en tránsito (HTTPS/TLS),
                            contraseñas hasheadas, autenticación segura mediante tokens JWT, y pagos procesados con estándar PCI DSS Nivel 1 a través de Stripe.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">7. Tus Derechos</h2>
                        <p className="mb-3">
                            Conforme al RGPD, tienes derecho a:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Acceder a tus datos personales.</li>
                            <li>Rectificar datos inexactos.</li>
                            <li>Solicitar la supresión de tus datos.</li>
                            <li>Oponerte al tratamiento o solicitar su limitación.</li>
                            <li>Portabilidad de datos.</li>
                        </ul>
                        <p className="mt-3">
                            Para ejercer cualquiera de estos derechos, contacta con nosotros en{' '}
                            <a href="mailto:privacidad@weblogistica.com" className="text-blue-400 hover:underline">privacidad@weblogistica.com</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">8. Cookies</h2>
                        <p>
                            Utilizamos cookies esenciales para el funcionamiento de la plataforma (autenticación y sesión).
                            No utilizamos cookies de seguimiento publicitario.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">9. Contacto</h2>
                        <p>
                            Si tienes preguntas sobre esta política, puedes contactarnos en{' '}
                            <a href="mailto:soporte@weblogistica.com" className="text-blue-400 hover:underline">soporte@weblogistica.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
