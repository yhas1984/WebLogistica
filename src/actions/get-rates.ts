'use server';

// ============================================================
// Server Action: Get Optimized Shipping Rates
// ============================================================

import { z } from 'zod';
import { headers } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';
import { getOptimizedRates } from '@/lib/logistics-orchestrator';
import type { RateResultsData } from '@/types';

const quoteSchema = z.object({
    originPostalCode: z.string().min(3, 'Código postal de origen requerido'),
    originCity: z.string().min(2, 'Ciudad de origen requerida'),
    originCountry: z.string().length(2, 'País de origen requerido (ISO 2)'),
    destinationPostalCode: z.string().min(3, 'Código postal de destino requerido'),
    destinationCity: z.string().min(2, 'Ciudad de destino requerida'),
    destinationCountry: z.string().length(2, 'País de destino requerido (ISO 2)'),
    weight: z.number().gt(0, 'El peso debe ser mayor que 0'),
    length: z.number().gt(0, 'El largo debe ser mayor que 0'),
    width: z.number().gt(0, 'El ancho debe ser mayor que 0'),
    height: z.number().gt(0, 'El alto debe ser mayor que 0'),
});

export type QuoteFormState = {
    success: boolean;
    data?: RateResultsData;
    error?: string;
    fieldErrors?: Record<string, string[]>;
};

export async function getRatesAction(
    formData: FormData
): Promise<QuoteFormState> {
    try {
        const rawData = {
            originPostalCode: formData.get('originPostalCode') as string,
            originCity: formData.get('originCity') as string,
            originCountry: (formData.get('originCountry') as string) || 'ES',
            destinationPostalCode: formData.get('destinationPostalCode') as string,
            destinationCity: formData.get('destinationCity') as string,
            destinationCountry: (formData.get('destinationCountry') as string) || 'ES',
            weight: parseFloat(formData.get('weight') as string),
            length: parseFloat(formData.get('length') as string),
            width: parseFloat(formData.get('width') as string),
            height: parseFloat(formData.get('height') as string),
        };

        console.log('[getRatesAction] Input:', rawData);

        const validation = quoteSchema.safeParse(rawData);

        if (!validation.success) {
            return {
                success: false,
                fieldErrors: validation.error.flatten().fieldErrors,
                error: 'Revisa los campos del formulario',
            };
        }

        // Lookup specific markup based on Host header (Subdomain specific logic)
        const reqHeaders = await headers();
        const host = reqHeaders.get('host') || '';
        const domain = host.split(':')[0]; // strip port just in case

        const supabase = await createServiceClient();
        const { data: subdomainData } = await supabase
            .from('subdomains')
            .select('markup_percentage')
            .eq('domain', domain)
            .single();

        // Use 15% as fallback for generic web, otherwise apply specific subdomain markup
        // Convert integer percentage (e.g., 15) to decimal (0.15) for the pricing formula
        const rawMarkup = subdomainData?.markup_percentage ?? 15;
        const subdomainMarkup = rawMarkup / 100;

        const results = await getOptimizedRates(validation.data, subdomainMarkup);

        if (results.rates.length === 0) {
            return {
                success: false,
                error: 'No se encontraron tarifas disponibles. Intenta con otras dimensiones.',
            };
        }

        return {
            success: true,
            data: results,
        };
    } catch (error) {
        console.error('[getRatesAction] Error:', error);
        return {
            success: false,
            error: 'Error interno del servidor. Inténtalo de nuevo.',
        };
    }
}
