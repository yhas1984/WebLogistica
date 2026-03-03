import { Resend } from 'resend';
import { render } from '@react-email/render';
import { LabelEmail } from '@/components/emails/label-email';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

interface SendLabelEmailParams {
    to: string;
    customerName: string;
    originCity: string;
    destCity: string;
    trackingNumber: string;
    labelUrl: string;
    carrierName: string;
}

export async function sendLabelEmail({
    to,
    customerName,
    originCity,
    destCity,
    trackingNumber,
    labelUrl,
    carrierName
}: SendLabelEmailParams) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[Resend] No API key found. Skipping email sending.');
        return;
    }

    try {
        const html = await render(
            React.createElement(LabelEmail, {
                customerName,
                originCity,
                destCity,
                trackingNumber,
                labelUrl,
                carrierName,
            })
        );

        const data = await resend.emails.send({
            from: 'WebLogista <envios@weblogistica.com>', // Asegúrate de verificar este dominio en Resend
            to: [to],
            subject: `Tu Etiqueta de Envío está Lista - ${trackingNumber}`,
            html: html,
        });

        console.log('[Resend] Email sent successfully:', data);
        return data;
    } catch (error) {
        console.error('[Resend] Failed to send email:', error);
        throw error;
    }
}
