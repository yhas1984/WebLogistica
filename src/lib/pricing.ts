// ============================================================
// Lógica de Precios
// Implementa seguridad contra el peso volumétrico (DIM Weight)
// y tarifa dinámica
// ============================================================

import type { CarrierRate, ParcelDimensions } from '@/types';

// Divisor estándar para peso volumétrico (cm/kg)
const DIM_DIVISOR = 5000;

/**
 * Calculamos el peso facturable asegurando que el cliente no envíe
 * menos "peso virtual" que el calculado por volumen de la caja.
 */
export function calculateBillableWeight(dimensions: ParcelDimensions): number {
    const { weight, length, width, height } = dimensions;

    // Cálculo del peso volumétrico: (L * A * H) / 5000
    const volumetricWeight = (length * width * height) / DIM_DIVISOR;

    // El peso facturable es siempre el mayor entre el real y el volumétrico
    return Math.max(weight, volumetricWeight);
}

export interface MarkupConfig {
    percentage: number; // Ej: 0.15 para 15%
    fixedFee: number;   // Tarifa fija de gestión
}

/**
 * Apply the dynamic markup formula to a cost price.
 * Returns the final consumer-facing price.
 */
export function applyMarkup(
    costPrice: number,
    config: MarkupConfig = { percentage: 0.15, fixedFee: 0.50 }
): number {
    // Calculamos el precio final añadiendo el margen porcentual y la tarifa fija
    const priceWithPercentage = costPrice * (1 + config.percentage);
    const finalPrice = priceWithPercentage + config.fixedFee;

    // Redondeamos a 2 decimales para evitar problemas con Stripe
    return Math.round(finalPrice * 100) / 100;
}

/**
 * Apply pricing to an array of carrier rates.
 * Mutates finalPrice on each rate.
 */
export function applyPricingToRates(
    rates: CarrierRate[],
    config: MarkupConfig = { percentage: 0.15, fixedFee: 0.50 }
): CarrierRate[] {
    return rates.map((rate) => ({
        ...rate,
        finalPrice: applyMarkup(rate.costPrice, config),
    }));
}

/**
 * Calcula el beneficio neto real restando las comisiones de la pasarela (Stripe aprox)
 */
export function calculateNetProfit(finalPrice: number, costPrice: number): number {
    const stripeFee = (finalPrice * 0.029) + 0.30; // Estimación estándar de Stripe
    const profit = finalPrice - costPrice - stripeFee;
    return Math.round(profit * 100) / 100;
}
