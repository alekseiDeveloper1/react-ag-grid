import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Stats } from './stats';
import { I18nProvider } from '../i18n/i18n.context';
import { ThemeProvider } from '../theme/theme.context';
import { STATS_API } from '../../api/stats.api';
import { db } from '../../dbs/stats.db';

// --- Mocks ---

// Mock API
vi.mock('../../api/stats.api', () => ({
    STATS_API: {
        getShort: vi.fn(),
    },
}));

// Mock DB
vi.mock('../../dbs/stats.db', () => ({
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

vi.mock('../../workers/stats.worker?worker', () => ({
    default: class MockWorkerConstructor {
        postMessage = mockPostMessage;
        terminate = mockTerminate;
        onmessage = null;
    },
}));

// --- Test Suite ---
describe('Stats Page (System Test)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        await db.delete();
        await db.open();
        // Default API mock - Return empty array instead of function to avoid DataCloneError in DB
        vi.mocked(STATS_API.getShort).mockResolvedValue([]);
    });

    const renderPage = () =>
        render(
            <MemoryRouter initialEntries={['/stats']}>
                <ThemeProvider>
                    <I18nProvider>
                        <Routes>
                            <Route path='/stats' element={<Stats />} />
                        </Routes>
                    </I18nProvider>
                </ThemeProvider>
            </MemoryRouter>,
        );

    it('renders the full page structure', async () => {
        renderPage();

        // Header
        expect(screen.getByText('Stats')).toBeInTheDocument();

        // Selector
        expect(screen.getByRole('combobox')).toBeInTheDocument(); // Metric selector

        // Toolbar buttons
        expect(screen.getByText('EN')).toBeInTheDocument();
        expect(screen.getByText('RU')).toBeInTheDocument();

        // Grid container (checking for loading state initially)
        expect(await screen.findByText(/Loading & Calculating.../i)).toBeInTheDocument();
    });

    it('changes language and updates translations', async () => {
        renderPage();

        const ruButton = screen.getByText('RU');

        // Switch to Russian
        fireEvent.click(ruButton);

        // Header title should change
        expect(screen.getByText('Статистика')).toBeInTheDocument();

        // Metric selector options should translate
        const select = screen.getByRole('combobox');
        expect(select).toHaveTextContent('Цена'); // "Cost" in RU
    });

    it('updates grid request when metric changes', async () => {
        renderPage();

        await waitFor(() => {
            expect(STATS_API.getShort).toHaveBeenCalled();
            // Check initial payload (default metric: cost)
            expect(mockPostMessage).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({ metric: 'cost' }),
                }),
            );
        });

        // 2. Change metric in dropdown
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'orders' } });

        // 3. Verify worker is called again with new metric
        await waitFor(() => {
            expect(mockPostMessage).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({ metric: 'orders' }),
                }),
            );
        });
    });

    it('toggles theme', () => {
        renderPage();

        const toggleBtn = screen.getByText('🌙'); // Assuming light theme start
        fireEvent.click(toggleBtn);

        // Check DOM attribute for theme
        expect(document.documentElement).toHaveAttribute('data-bs-theme', 'dark');

        // Button icon should change
        expect(screen.getByText('☀️')).toBeInTheDocument();
    });
});
