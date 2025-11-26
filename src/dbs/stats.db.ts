import Dexie, { Table } from 'dexie';
import { IStatItemRaw } from '../types/stats.types';

const DB_NAME = 'AdStatsDB';
const CACHE_TABLE = 'raw_stats_cache';

interface ICacheEntry {
    id: string;
    timestamp: number;
    data: IStatItemRaw[];
}

export class AdStatsDatabase extends Dexie {
    [CACHE_TABLE]!: Table<ICacheEntry>;

    constructor() {
        super(DB_NAME);

        this.version(1).stores({
            [CACHE_TABLE]: 'id',
        });
    }

    async saveStats(key: string, data: IStatItemRaw[]) {
        await this[CACHE_TABLE].put({
            id: key,
            timestamp: Date.now(),
            data,
        });
    }

    async getStats(key: string, maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<IStatItemRaw[] | null> {
        const entry = await this[CACHE_TABLE].get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > maxAgeMs) {
            return null;
        }

        return entry.data;
    }
}

export const db = new AdStatsDatabase();
