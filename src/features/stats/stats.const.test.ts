import { describe, it, expect } from 'vitest';
import { isMetric, Metrics } from './stats.const';

describe('Stats Constants & Utils', () => {
    describe('isMetric', () => {
        it('returns true for valid metrics', () => {
            expect(isMetric('cost')).toBe(true);
            expect(isMetric('revenue')).toBe(true);
        });

        it('returns false for invalid strings', () => {
            expect(isMetric('invalid_metric')).toBe(false);
            expect(isMetric('')).toBe(false);
            expect(isMetric('COST')).toBe(false); // Case sensitive
        });
    });

    describe('Metrics Enum', () => {
        it('has all required keys', () => {
            expect(Object.values(Metrics)).toEqual(['cost', 'orders', 'returns', 'revenue', 'buyouts']);
        });
    });
});
