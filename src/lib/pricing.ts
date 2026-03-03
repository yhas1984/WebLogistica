// ============================================================
// Dynamic Pricing Engine
// Formula: (cost_price + stripe_fee) × 1.15 + 0.50€
// ============================================================

import type { CarrierRate } from '@/types';

// Stripe standard fees (EU)
const STRIPE_PERCENTAGE_FEE = 0.029; // 2.9%
const STRIPE_FIXED_FEE = 0.30;      // €0.30

// Platform markup
const MARGIN_MULTIPLIER = 1.15;      // 15% margin
const FIXED_PLATFORM_FEE = 0.50;    // €0.50

/**
 * Calculate the Stripe processing fee for a given amount.
 */
export function calculateStripeFee(amount: number): number {
    return amount * STRIPE_PERCENTAGE_FEE + STRIPE_FIXED_FEE;
}

/**
 * Apply the dynamic markup formula to a cost price.
 * Returns the final consumer-facing price.
 */
export function applyMarkup(costPrice: number, subdomainMarkup: number = 0): number {
    const stripeFee = calculateStripeFee(costPrice);
    const baseWithFees = costPrice + stripeFee;
    const withMargin = baseWithFees * MARGIN_MULTIPLIER;
    const withPlatformFee = withMargin + FIXED_PLATFORM_FEE;
    const withSubdomainMarkup = withPlatformFee + subdomainMarkup;

    // Round to 2 decimal places
    return Math.round(withSubdomainMarkup * 100) / 100;
}

/**
 * Apply pricing to an array of carrier rates.
 * Mutates finalPrice on each rate.
 */
export function applyPricingToRates(
    rates: CarrierRate[],
    subdomainMarkup: number = 0
): CarrierRate[] {
    return rates.map((rate) => ({
        ...rate,
        finalPrice: applyMarkup(rate.costPrice, subdomainMarkup),
    }));
}

/**
 * Calculate the margin breakdown for a given shipment.
 */
export function getMarginBreakdown(costPrice: number, finalPrice: number) {
    const stripeFee = calculateStripeFee(costPrice);
    const grossMargin = finalPrice - costPrice - stripeFee;
    const marginPercentage = (grossMargin / finalPrice) * 100;

    return {
        costPrice: Math.round(costPrice * 100) / 100,
        stripeFee: Math.round(stripeFee * 100) / 100,
        grossMargin: Math.round(grossMargin * 100) / 100,
        finalPrice: Math.round(finalPrice * 100) / 100,
        marginPercentage: Math.round(marginPercentage * 10) / 10,
    };
}
