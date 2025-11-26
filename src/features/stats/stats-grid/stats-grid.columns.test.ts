import { describe, it, expect } from 'vitest';
import { statsGridColumnsFactory } from './stats-grid.columns';

describe('statsGridColumnsFactory', () => {
    const mockDates = ['2024-01-01', '2024-01-02', '2024-01-03'];
    // Mock translation function
    const t = (key: string) => key;

    it('creates correct number of columns', () => {
        const columns = statsGridColumnsFactory(mockDates, t);

        // 4 Metadata (hidden) + 3 Dates + 2 Summary (Sum/Avg) = 9
        expect(columns.length).toBe(9);
    });

    it('configures date columns with aggregation', () => {
        const columns = statsGridColumnsFactory(mockDates, t);

        // Check a date column (index 4 starts dates: meta=0,1,2,3)
        const firstDayCol = columns.find((c) => c.headerName === '2024-01-01');

        expect(firstDayCol).toBeDefined();
        expect(firstDayCol?.field).toBe('day_0');
        expect(firstDayCol?.aggFunc).toBe('sum');
    });

    it('configures summary columns correctly', () => {
        const columns = statsGridColumnsFactory(mockDates, t);

        const sumCol = columns.find((c) => c.colId === 'sums');
        const avgCol = columns.find((c) => c.colId === 'average');

        expect(sumCol?.aggFunc).toBe('sum');
        expect(avgCol?.aggFunc).toBe('avg');
    });
});
