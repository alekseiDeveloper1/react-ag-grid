import { AgGridReact } from 'ag-grid-react';
import { useEffect, useMemo, useState } from 'react';
import { IStatItem, StatMetricType } from '../../../types/stats.types';
import { STATS_API } from '../../../api/stats.api';
import { ColDef, ICellRendererParams, themeBalham } from 'ag-grid-enterprise';
import { useSearchParams } from 'react-router-dom';
import { Metrics } from '../stats.const';
import { statsGridColumnsFactory } from './stats-grid.columns';
import './stats-grid.scss';
import { useI18n } from '../../i18n/i18n.context.tsx';
import { useTheme } from '../../theme/theme.context.tsx';

export function StatsGrid() {
    const [rowData, setRowData] = useState<IStatItem[] | null>(null);

    const { t } = useI18n();
    const { theme } = useTheme();
    const [searchParams] = useSearchParams();

    const [columnDefs, setColumnDefs] = useState<ColDef<IStatItem>[]>([]);
    const metric = (searchParams.get('metric') as StatMetricType) ?? Metrics.cost;

    useEffect(() => {
        const today = new Date();
        const dates = Array.from({ length: 30 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            return d.toISOString().split('T')[0];
        });
        setColumnDefs(statsGridColumnsFactory(metric, dates, t));
    }, [metric, t]);

    useEffect(() => {
        fetchData()
    }, []);

    const fetchData = async () => {
        setRowData(null);
        try {
            const rawData = await STATS_API.getShort();
            setRowData(rawData)
        } catch (error) {
            console.error("Failed to load stats", error);
        }
    }

    const autoGroupColumnDef = useMemo<ColDef>(() => ({
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
    }), [t]);

    const MyLoadingOverlay = () => {
        return (
            <div className="ag-overlay-loading-center">
                {t('grid.loading')}
            </div>
        );
    };

    return (
        <div className={`stats-grid ${theme === 'dark' ? 'ag-theme-balham-dark' : 'ag-theme-balham'}`}>
            <AgGridReact
                autoGroupColumnDef={autoGroupColumnDef}
                theme={themeBalham.withParams({
                    backgroundColor: 'var(--bs-body-bg)',
                    foregroundColor: 'var(--bs-body-color)',
                    browserColorScheme: theme,
                })}
                loadingOverlayComponent={MyLoadingOverlay}
                rowData={rowData}
                columnDefs={columnDefs}
            ></AgGridReact>
        </div>
    );
}
