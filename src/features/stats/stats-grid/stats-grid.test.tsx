import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StatsGrid } from './stats-grid';
import { MemoryRouter } from 'react-router-dom';
import { STATS_API } from '../../../api/stats.api';
import { db } from '../../../dbs/stats.db';
import { I18nProvider } from '../../i18n/i18n.context';
import { ThemeProvider } from '../../theme/theme.context';

// --- Mocks ---

// Mock API
vi.mock('../../../api/stats.api', () => ({
    STATS_API: {
        getShort: vi.fn(),
    },
}));

// Mock DB
vi.mock('../../../dbs/stats.db', () => ({
    db: {
        getStats: vi.fn(),
        saveStats: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn(),
        open: vi.fn(),
    },
}));

// Mock Worker
const mockPostMessage = vi.fn();
const mockTerminate = vi.fn();
let lastCreatedWorker: Worker | null = null;

vi.mock('../../../workers/stats.worker?worker', () => ({
    default: class MockWorkerConstructor implements Worker {
        postMessage = mockPostMessage;
        terminate = mockTerminate;

        onerror: ((e: ErrorEvent) => void) | null = null;
        onmessage: ((e: MessageEvent) => void) | null = null;
        onmessageerror: ((e: MessageEvent) => void) | null = null;

        addEventListener: Worker['addEventListener'] = vi.fn();
        removeEventListener: Worker['removeEventListener'] = vi.fn();
        dispatchEvent: Worker['dispatchEvent'] = vi.fn();

        constructor() {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            lastCreatedWorker = this;
        }
    },
}));

describe('StatsGrid Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        lastCreatedWorker = null;
    });

    const renderGrid = () =>
        render(
            <MemoryRouter>
                <ThemeProvider>
                    <I18nProvider>
                        <StatsGrid />
                    </I18nProvider>
                </ThemeProvider>
            </MemoryRouter>,
        );

    it('renders loading state initially', async () => {
        // Setup: Mock API to hang or return eventually, DB returns null (no cache)
        vi.mocked(db.getStats).mockResolvedValue(null);
        vi.mocked(STATS_API.getShort).mockImplementation(() => new Promise(() => {})); // Never resolves

        renderGrid();

        // Expect loading overlay text
        expect(await screen.findByText(/Loading & Calculating.../i)).toBeInTheDocument();
    });

    it('fetches data, sends to worker, and renders formatted results', async () => {
        const mockRawData = [
            {
                article: 'ART-001',
                type: 'Sneakers',
                brand: 'BrandX',
                supplier: 'SupplierY',
                cost: [36181, 73638],
                orders: [26, 97],
                returns: [8, 18],
                lastUpdate: '2025-11-01T10:58:08.179Z',
            },
        ];

        const mockProcessedData = [
            {
                id: 'SupplierY_BrandX_ART-001_0',
                type: 'Sneakers',
                article: 'ART-001',
                brand: 'BrandX',
                supplier: 'SupplierY',
                day_0: 36181,
                day_1: 73638,
                row_sum: 298287,
                row_avg: 9942.9,
            },
        ];

        // Worker payload mimicking a response
        // Dates should match the columns we expect to see
        const workerPayload = {
            processedData: mockProcessedData,
            dates: ['2025-11-01', '2025-10-31', '2025-10-30'],
        };

        // 1. Setup: No cache, API returns data
        vi.mocked(db.getStats).mockResolvedValue(null);
        vi.mocked(STATS_API.getShort).mockResolvedValue(mockRawData);

        renderGrid();

        // 2. Wait for API to be called
        await waitFor(() => {
            expect(STATS_API.getShort).toHaveBeenCalled();
        });

        // 3. Verify Worker received message
        await waitFor(() => {
            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'processData',
                    payload: expect.objectContaining({ raw: mockRawData }),
                }),
            );
        });

        // 4. Simulate Worker response
        await act(async () => {
            if (lastCreatedWorker && lastCreatedWorker.onmessage) {
                lastCreatedWorker.onmessage({
                    data: {
                        action: 'dataProcessed',
                        payload: workerPayload,
                    },
                } as MessageEvent);
            }
        });

        // 5. Assert Grid content
        // Note: 36181 -> "36,181" (en-US). Regex handles separation.
        const cellValue = await screen.findByText(/36.*181/);
        expect(cellValue).toBeInTheDocument();

        // Ensure column headers from 'dates' are rendered
        expect(await screen.findByText('2025-11-01')).toBeInTheDocument();
    });

    it('uses cached data from IndexedDB if available', async () => {
        const mockCachedData = [
            {
                article: 'cached_art',
                cost: [],
                orders: [],
                returns: [],
                lastUpdate: '',
                type: 'MockType',
                brand: 'MockBrand',
                supplier: 'MockSupplier',
            },
        ];

        // Mock getStats to return cached data
        vi.mocked(db.getStats).mockResolvedValue(mockCachedData);

        renderGrid();

        await waitFor(() => {
            // Should verify worker was called
            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'processData',
                    payload: expect.objectContaining({ raw: mockCachedData }),
                }),
            );
        });

        // API should NOT be called because cache exists
        expect(STATS_API.getShort).not.toHaveBeenCalled();
    });
});
