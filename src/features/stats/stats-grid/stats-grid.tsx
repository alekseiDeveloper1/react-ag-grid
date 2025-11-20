import { AgGridReact } from 'ag-grid-react';
import { useEffect, useState } from 'react';
import { IStatItem } from '../../../types/stats.types';
import { STATS_API } from '../../../api/stats.api';
import { ColDef, ICellRendererParams, themeBalham } from 'ag-grid-enterprise';
import { useSearchParams } from 'react-router-dom';
import { Metrics } from '../stats.const';
import { statsGridColumnsFactory } from './stats-grid.columns';
import './stats-grid.scss';

export function StatsGrid() {
    const [rowData, setRowData] = useState<IStatItem[] | null>(null);
    const [columnDefs, setColumnDefs] = useState<ColDef<IStatItem>[]>([]);
    const [searchParams] = useSearchParams();
    const metric = searchParams.get('metric') ?? Metrics.cost;

    useEffect(() => {
        const dates = Array.from({ length: 30 }, (_, i) => new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        setColumnDefs(statsGridColumnsFactory(metric, dates));
    }, [metric]);

    useEffect(() => {
        STATS_API.getShort().then((data) => setRowData(data));
    }, []);

    const showArticleInGroup = {
        innerRenderer: (params: ICellRendererParams) => {
            if (!params.data) {
                return params.value || '';
            }
            return params.data.article;
        },
    }

    return (
        <div className='stats-grid ag-theme-balham'>
            <AgGridReact
                autoGroupColumnDef={{
                    menuTabs: ['columnsMenuTab'],
                    pinned: 'left',
                    cellRenderer: 'agGroupCellRenderer',
                    cellRendererParams: showArticleInGroup,
                }}
                theme={themeBalham.withParams({
                    backgroundColor: 'var(--bs-body-bg)',
                    foregroundColor: 'var(--bs-body-color)',
                    browserColorScheme: 'light',
                })}
                rowData={rowData}
                columnDefs={columnDefs}
            ></AgGridReact>
        </div>
    );
}
