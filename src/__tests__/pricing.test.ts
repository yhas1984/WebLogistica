import { describe, it, expect } from 'vitest';
import {
    calculateBillableWeight,
    applyMarkup,
    applyPricingToRates,
    estimateStripeFee,
    calculateNetProfit,
} from '@/lib/pricing';
import type { CarrierRate, ParcelDimensions } from '@/types';

describe('calculateBillableWeight', () => {
    it('returns real weight when it is higher than volumetric', () => {
        const dims: ParcelDimensions = { weight: 10, length: 20, width: 20, height: 20 };
        // volumetric = (20*20*20)/5000 = 1.6
        expect(calculateBillableWeight(dims)).toBe(10);
    });

    it('returns volumetric weight when it is higher than real', () => {
        const dims: ParcelDimensions = { weight: 1, length: 50, width: 50, height: 50 };
        // volumetric = (50*50*50)/5000 = 25
        expect(calculateBillableWeight(dims)).toBe(25);
    });

    it('returns real weight when both are equal', () => {
        const dims: ParcelDimensions = { weight: 8, length: 40, width: 10, height: 10 };
        // volumetric = (40*10*10)/5000 = 0.8
        expect(calculateBillableWeight(dims)).toBe(8);
    });
});

describe('applyMarkup', () => {
    it('applies default 15% + 0.50€ markup', () => {
        const result = applyMarkup(10);
        // (10 * 1.15) + 0.50 = 12.00
        expect(result).toBe(12);
    });

    it('applies custom percentage and fixed fee', () => {
        const result = applyMarkup(20, { percentage: 0.10, fixedFee: 1.00 });
        // (20 * 1.10) + 1.00 = 23.00
        expect(result).toBe(23);
    });

    it('rounds to 2 decimal places', () => {
        const result = applyMarkup(7.33);
        // (7.33 * 1.15) + 0.50 = 8.4295 + 0.50 = 8.9295 -> 8.93
        expect(result).toBe(8.93);
    });
});

describe('applyPricingToRates', () => {
    it('applies markup to all rates', () => {
        const rates: CarrierRate[] = [
            {
                id: '1',
                provider: 'shippo',
                carrierName: 'DHL',
                serviceName: 'Express',
                serviceType: 'door_to_door',
                estimatedDays: 1,
                costPrice: 10,
                finalPrice: 0,
                currency: 'EUR',
            },
            {
                id: '2',
                provider: 'shippo',
                carrierName: 'SEUR',
                serviceName: 'Standard',
                serviceType: 'door_to_door',
                estimatedDays: 3,
                costPrice: 5,
                finalPrice: 0,
                currency: 'EUR',
            },
        ];

        const result = applyPricingToRates(rates);
        expect(result[0].finalPrice).toBe(12); // (10 * 1.15) + 0.50
        expect(result[1].finalPrice).toBe(6.25); // (5 * 1.15) + 0.50
    });
});

describe('estimateStripeFee', () => {
    it('calculates European Stripe fee (1.5% + 0.25€)', () => {
        expect(estimateStripeFee(100)).toBe(1.75); // (100 * 0.015) + 0.25
        expect(estimateStripeFee(50)).toBe(1); // (50 * 0.015) + 0.25 = 1.00
    });

    it('rounds to 2 decimal places', () => {
        expect(estimateStripeFee(33.33)).toBe(0.75); // (33.33 * 0.015) + 0.25 = 0.74995 -> 0.75
    });
});

describe('calculateNetProfit', () => {
    it('calculates profit after Stripe fees', () => {
        const profit = calculateNetProfit(15, 10);
        // stripeFee = (15 * 0.015) + 0.25 = 0.475 -> 0.48
        // profit = 15 - 10 - 0.48 = 4.52
        expect(profit).toBe(4.52);
    });

    it('handles zero cost', () => {
        const profit = calculateNetProfit(10, 0);
        // stripeFee = (10 * 0.015) + 0.25 = 0.40
        // profit = 10 - 0 - 0.40 = 9.60
        expect(profit).toBe(9.6);
    });
});
