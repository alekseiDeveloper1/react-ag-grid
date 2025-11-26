import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processData } from './stats.worker';
import { IStatItemRaw } from '../types/stats.types';

describe('Stats Worker Logic', () => {
    // "Today" for testing: May 10, 2024 12:00:00 Local Time
    const MOCK_TODAY = new Date(2024, 4, 10, 12, 0, 0);

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(MOCK_TODAY);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const mockItemBase: IStatItemRaw = {
        article: 'ART1',
        brand: 'Nike',
        supplier: 'Sup1',
        type: 'Shoes',
        cost: [100, 200, 300], // index 0 (latest), index 1 (yesterday relative to update), index 2...
        orders: [10, 5, 2],
        returns: [2, 1, 0],
        lastUpdate: '2024-05-10T10:00:00', // Matches MOCK_TODAY date
    };

    describe('Metric Calculations', () => {
        it('calculates buyouts correctly (orders - returns)', () => {
            const { processedData } = processData([mockItemBase], 'buyouts');

            // Index 0: 10 - 2 = 8
            // Index 1: 5 - 1 = 4
            // Index 2: 2 - 0 = 2
            expect(processedData[0].day_0).toBe(8);
            expect(processedData[0].day_1).toBe(4);
            expect(processedData[0].day_2).toBe(2);
        });

        it('calculates revenue correctly (cost * buyouts)', () => {
            const { processedData } = processData([mockItemBase], 'revenue');

            // Index 0: 100 * (10 - 2) = 800
            // Index 1: 200 * (5 - 1) = 800
            expect(processedData[0].day_0).toBe(800);
            expect(processedData[0].day_1).toBe(800);
        });

        it('calculates row summary correctly', () => {
            const { processedData } = processData([mockItemBase], 'cost');
            // 100 + 200 + 300 = 600 (rest are 0)
            expect(processedData[0].row_sum).toBe(600);
            expect(processedData[0].row_avg).toBe(20); // 600 / 30 days
        });
    });

    describe('Date Alignment', () => {
        it('generates correct date headers starting from Today', () => {
            const { dates } = processData([mockItemBase], 'cost');

            // Should start with 2024-05-10 and go backwards
            expect(dates[0]).toBe('2024-05-10');
            expect(dates[1]).toBe('2024-05-09');
            expect(dates[29]).toBe('2024-04-11');
            expect(dates.length).toBe(30);
        });

        it('aligns data to day_0 when lastUpdate is Today', () => {
            const { processedData } = processData([mockItemBase], 'cost');
            // Diff = 0
            expect(processedData[0].day_0).toBe(100); // Index 0
            expect(processedData[0].day_1).toBe(200); // Index 1
        });

        it('shifts data to day_1 when lastUpdate was Yesterday', () => {
            const yesterdayItem = {
                ...mockItemBase,
                lastUpdate: '2024-05-09T10:00:00', // 1 day before Mock Today (May 10)
            };

            const { processedData } = processData([yesterdayItem], 'cost');

            // Diff = 1
            expect(processedData[0].day_0).toBe(0); // Today has no data
            expect(processedData[0].day_1).toBe(100); // Yesterday has index 0
            expect(processedData[0].day_2).toBe(200); // 2 days ago has index 1
        });

        it('handles data passing across month boundaries', () => {
            // Mock Today: May 10
            // Last Update: April 30 (10 days ago)
            const oldItem = {
                ...mockItemBase,
                lastUpdate: '2024-04-30T10:00:00',
            };

            const { processedData } = processData([oldItem], 'cost');

            // Diff = 10 days (May 10 - April 30)
            // day_0 (May 10) to day_9 (May 1) should be 0
            // day_10 (April 30) should have index 0 (100)
            expect(processedData[0].day_0).toBe(0);
            expect(processedData[0].day_9).toBe(0);
            expect(processedData[0].day_10).toBe(100);
            expect(processedData[0].day_11).toBe(200);
        });

        it('handles data passing across year boundaries', () => {
            // Set System time to Jan 2, 2024
            vi.setSystemTime(new Date(2024, 0, 2, 12, 0, 0));

            // Last update: Dec 31, 2023
            const prevYearItem = {
                ...mockItemBase,
                lastUpdate: '2023-12-31T10:00:00',
            };

            const { processedData, dates } = processData([prevYearItem], 'cost');

            // Check headers
            expect(dates[0]).toBe('2024-01-02');
            expect(dates[1]).toBe('2024-01-01');
            expect(dates[2]).toBe('2023-12-31');

            // Diff = 2 days (Jan 2 minus Dec 31)
            // day_0 (Jan 2) -> 0
            // day_1 (Jan 1) -> 0
            // day_2 (Dec 31) -> index 0 (100)
            expect(processedData[0].day_0).toBe(0);
            expect(processedData[0].day_1).toBe(0);
            expect(processedData[0].day_2).toBe(100);
        });

        it('handles completely expired data (older than 30 days)', () => {
            const veryOldItem = {
                ...mockItemBase,
                lastUpdate: '2024-01-01T10:00:00', // Months ago
            };
            const { processedData } = processData([veryOldItem], 'cost');

            // Should be all zeros
            expect(processedData[0].day_0).toBe(0);
            expect(processedData[0].day_29).toBe(0);
            expect(processedData[0].row_sum).toBe(0);
        });

        it('handles future dates gracefully (e.g. timezone variations)', () => {
            const futureItem = {
                ...mockItemBase,
                lastUpdate: '2024-05-11T10:00:00', // Tomorrow relative to May 10
            };

            const { processedData } = processData([futureItem], 'cost');

            // Diff = -1
            // targetDayIndex 0 (Today). sourceIndex = 0 - (-1) = 1.
            // So day_0 should show index 1 (200).
            expect(processedData[0].day_0).toBe(200);
        });
    });
});
