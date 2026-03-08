import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Términos y Condiciones | WebLogistica',
    description: 'Términos, condiciones de uso y políticas legales de los servicios de WebLogistica para envíos, comparativa de tarifas y pasarelas de pago.',
    alternates: {
        canonical: '/terminos',
    }
};

export default function TerminosPage() {
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
                    <div className="icon-badge icon-badge-blue">
                        <FileText className="w-5 h-5" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Términos y Condiciones</h1>
                </div>

                <div className="space-y-8 text-sm text-white/50 leading-relaxed">
                    <p className="text-white/60">
                        Última actualización: 5 de marzo de 2026
                    </p>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">1. Aceptación de los Términos</h2>
                        <p>
                            Al acceder y utilizar WebLogistica aceptas estos términos y condiciones en su totalidad.
                            Si no estás de acuerdo con alguno de ellos, te rogamos que no utilices la plataforma.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">2. Descripción del Servicio</h2>
                        <p>
                            WebLogistica es una plataforma de comparación y contratación de servicios de envío.
                            Actuamos como intermediarios entre tú (el usuario) y los transportistas (DHL, SEUR, UPS, FedEx, Correos, etc.).
                            Facilitamos la comparación de tarifas, la contratación del envío, la generación de etiquetas y el seguimiento de paquetes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">3. Registro y Cuenta</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Debes ser mayor de 18 años para crear una cuenta.</li>
                            <li>Eres responsable de mantener la confidencialidad de tus credenciales.</li>
                            <li>La información proporcionada durante el registro debe ser veraz y actualizada.</li>
                            <li>Nos reservamos el derecho de suspender cuentas que incumplan estos términos.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">4. Proceso de Envío</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-white/70">Cotización:</strong> las tarifas mostradas son en tiempo real y pueden variar según disponibilidad del transportista.</li>
                            <li><strong className="text-white/70">Pago:</strong> una vez confirmado el pago, el envío se considera contratado y se procede a generar la etiqueta.</li>
                            <li><strong className="text-white/70">Etiqueta:</strong> la etiqueta generada es responsabilidad del usuario imprimirla y pegarla correctamente en el paquete.</li>
                            <li><strong className="text-white/70">Recogida/Entrega:</strong> los plazos de entrega son estimaciones proporcionadas por los transportistas y no constituyen una garantía.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">5. Precios y Pagos</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Todos los precios se muestran en euros (€) e incluyen impuestos aplicables salvo indicación contraria.</li>
                            <li>Los pagos se procesan de forma segura a través de Stripe.</li>
                            <li>WebLogistica no almacena datos de tarjeta de crédito en sus servidores.</li>
                            <li>El precio final puede incluir un margen de servicio sobre la tarifa base del transportista.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">6. Cancelaciones y Reembolsos</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Puedes solicitar la cancelación de un envío antes de que el paquete sea recogido por el transportista.</li>
                            <li>Una vez recogido el paquete, la cancelación está sujeta a las políticas del transportista correspondiente.</li>
                            <li>Los reembolsos se procesarán a través del mismo método de pago utilizado, en un plazo de 5-10 días hábiles.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">7. Artículos Prohibidos</h2>
                        <p className="mb-3">No está permitido enviar a través de nuestra plataforma:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Sustancias peligrosas, inflamables, explosivas o tóxicas.</li>
                            <li>Drogas ilegales o sustancias controladas.</li>
                            <li>Armas de fuego, municiones o material bélico.</li>
                            <li>Dinero en efectivo, documentos negociables o metales preciosos sin declarar.</li>
                            <li>Animales vivos.</li>
                            <li>Cualquier artículo cuyo transporte esté prohibido por la legislación aplicable.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">8. Responsabilidad</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>WebLogistica actúa como intermediario. La responsabilidad sobre el transporte físico recae en el transportista contratado.</li>
                            <li>En caso de pérdida o daño del paquete, la reclamación se gestionará conforme a las condiciones del transportista.</li>
                            <li>Nuestra responsabilidad se limita al valor del servicio contratado a través de nuestra plataforma.</li>
                            <li>No nos hacemos responsables de retrasos causados por circunstancias fuera de nuestro control (climatología, huelgas, aduanas, etc.).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">9. Propiedad Intelectual</h2>
                        <p>
                            Todo el contenido de la plataforma (diseño, textos, logotipos, código fuente) es propiedad de WebLogistica
                            y está protegido por las leyes de propiedad intelectual. Queda prohibida su reproducción sin autorización expresa.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">10. Modificaciones</h2>
                        <p>
                            Nos reservamos el derecho de modificar estos términos en cualquier momento.
                            Las modificaciones entrarán en vigor desde su publicación en la plataforma.
                            El uso continuado del servicio tras la publicación de cambios implica su aceptación.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">11. Legislación Aplicable</h2>
                        <p>
                            Estos términos se rigen por la legislación española y de la Unión Europea.
                            Cualquier controversia se someterá a los juzgados y tribunales competentes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold text-white mb-3">12. Contacto</h2>
                        <p>
                            Para cualquier consulta sobre estos términos, escríbenos a{' '}
                            <a href="mailto:soporte@weblogistica.com" className="text-blue-400 hover:underline">soporte@weblogistica.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
