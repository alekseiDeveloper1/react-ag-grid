import { AgGridReact } from 'ag-grid-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IStatItemProcessed, StatMetricType } from '../../../types/stats.types';
import { STATS_API } from '../../../api/stats.api';
import { ColDef, GetRowIdParams, ICellRendererParams, themeBalham } from 'ag-grid-enterprise';
import { useSearchParams } from 'react-router-dom';
import { Metrics } from '../stats.const';
import { statsGridColumnsFactory } from './stats-grid.columns';
import './stats-grid.scss';
import { useI18n } from '../../i18n/i18n.context';
import { useTheme } from '../../theme/theme.context';
import { db } from '../../../dbs/stats.db';
import StatsWorker from '../../../workers/stats.worker?worker';

export function StatsGrid() {
    const [rowData, setRowData] = useState<IStatItemProcessed[] | null>(null);
    const [dates, setDates] = useState<string[]>([]);

    const { t } = useI18n();
    const { theme } = useTheme();
    const [searchParams] = useSearchParams();

    const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
    const metric = (searchParams.get('metric') as StatMetricType) ?? Metrics.cost;
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        workerRef.current = new StatsWorker();
        workerRef.current.onmessage = (event) => {
            if (event.data.action === 'dataProcessed') {
                const { processedData, dates: newDates } = event.data.payload;
                setRowData(processedData);
                setDates(newDates);
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    useEffect(() => {
        if (dates.length > 0) {
            setColumnDefs(statsGridColumnsFactory(dates, t));
        }
    }, [dates, t]);

    useEffect(() => {
        fetchData();
    }, [metric]);

    const fetchData = async () => {
        setRowData(null);

        try {
            const cacheKey = 'full_stats';
            let rawData = await db.getStats(cacheKey);
            if (!rawData) {
                rawData = await STATS_API.getShort();
                db.saveStats(cacheKey, rawData).catch(console.error);
            }

            if (workerRef.current) {
                workerRef.current.postMessage({
                    action: 'processData',
                    payload: { raw: rawData, metric },
                });
            }
        } catch (error) {
            console.error('Failed to load stats', error);
        }
    };

    const getRowId = useCallback((params: GetRowIdParams) => {
        return params.data.id;
    }, []);

    const autoGroupColumnDef = useMemo<ColDef>(
        () => ({
            headerName: t('grid.group_article'),
            minWidth: 250,
            pinned: 'left',
            cellRenderer: 'agGroupCellRenderer',
            cellRendererParams: {
                // showArticleInGroup
                innerRenderer: (params: ICellRendererParams) => {
                    if (!params.data) {
                        return params.value || '';
                    }
                    return params.data.article;
                },
            },
        }),
        [t],
    );

    const MyLoadingOverlay = () => {
        return <div className='ag-overlay-loading-center'>{t('grid.loading')}</div>;
    };

    return (
        <div className={`stats-grid ${theme === 'dark' ? 'ag-theme-balham-dark' : 'ag-theme-balham'}`}>
            <AgGridReact
                autoGroupColumnDef={autoGroupColumnDef}
                animateRows={false}
                getRowId={getRowId}
                theme={themeBalham.withParams({
                    backgroundColor: 'var(--bs-body-bg)',
                    foregroundColor: 'var(--bs-body-color)',
                    browserColorScheme: theme,
                })}
                loadingOverlayComponent={MyLoadingOverlay}
                rowData={rowData}
                columnDefs={columnDefs}
                suppressAggFuncInHeader={true}
            ></AgGridReact>
        </div>
    );
}
