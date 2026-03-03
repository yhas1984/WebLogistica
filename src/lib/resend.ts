import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

interface SendLabelEmailParams {
    to: string;
    trackingNumber: string;
    labelUrl: string;
    shipmentId: string;
}

export async function sendLabelEmail({ to, trackingNumber, labelUrl, shipmentId }: SendLabelEmailParams) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[Resend] No API key found. Skipping email sending.');
        return;
    }

    try {
        const data = await resend.emails.send({
            from: 'WebLogistica <no-reply@weblogistica.com>', // Update with a verified domain later
            to: [to],
            subject: `Tu Etiqueta de Envío está Lista - ${trackingNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2>¡Tu envío ha sido procesado exitosamente!</h2>
                    <p>Referencia del pedido: <strong>${shipmentId}</strong></p>
                    <p>Número de Seguimiento: <strong>${trackingNumber}</strong></p>
                    
                    <div style="margin: 30px 0;">
                        <a href="${labelUrl}" 
                           style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                           Descargar Etiqueta (PDF)
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #666;">
                        Por favor, imprime esta etiqueta y pégala de forma visible en el exterior de tu paquete antes de entregarlo al transportista.
                    </p>
                    
                    <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eaeaea;" />
                    <p style="font-size: 12px; color: #999;">
                        Gracias por confiar en WebLogistica para tus envíos.
                    </p>
                </div>
            `,
        });

        console.log('[Resend] Email sent successfully:', data);
        return data;
    } catch (error) {
        console.error('[Resend] Failed to send email:', error);
        throw error;
    }
}
