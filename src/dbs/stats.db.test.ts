import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from './stats.db';
import { IStatItemRaw } from '../types/stats.types';

describe('AdStatsDatabase', () => {
    beforeEach(async () => {
        // Clear DB before each test
        await db.delete();
        await db.open();
    });

    const mockData: IStatItemRaw[] = [
        { article: '1', brand: 'B', supplier: 'S', type: 'T', cost: [], orders: [], returns: [], lastUpdate: '' },
    ];

    it('saves and retrieves stats', async () => {
        await db.saveStats('test_key', mockData);
        const result = await db.getStats('test_key');

        expect(result).toEqual(mockData);
    });

    it('returns null for non-existent key', async () => {
        const result = await db.getStats('missing_key');
        expect(result).toBeNull();
    });

    it('returns null if cache is expired', async () => {
        // Mock Date.now to return start time
        const startTime = 1000;
        vi.spyOn(Date, 'now').mockReturnValue(startTime);

        await db.saveStats('expired_key', mockData);

        // Advance time beyond expiration (default 24h)
        const futureTime = startTime + 24 * 60 * 60 * 1000 + 1;
        vi.spyOn(Date, 'now').mockReturnValue(futureTime);

        const result = await db.getStats('expired_key');
        expect(result).toBeNull();
    });
});
