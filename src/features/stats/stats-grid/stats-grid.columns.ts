import { ColDef, ColDefField, ValueFormatterParams } from 'ag-grid-enterprise';
import { IStatItem, IStatItemProcessed, ORDERED_LEVELS } from '../../../types/stats.types';
import { TranslationKey } from '../../i18n/resources';

export function statsGridColumnsFactory<T extends IStatItem>(dates: string[], t: (key: TranslationKey) => string) {
    const metadataColumns: ColDef<T>[] = ORDERED_LEVELS.map((level, index) => ({
        colId: level,
        headerName: t(`meta.${level}` as TranslationKey),
        field: level as ColDefField<T>,
        rowGroup: level !== 'article',
        rowGroupIndex: index,
        initialHide: true,
    }));

    const sumColumn: ColDef<IStatItemProcessed> = {
        colId: 'sums',
        headerName: t('grid.sum'),
        field: 'row_sum',
        aggFunc: 'sum',
        pinned: 'right',
        width: 100,
        valueFormatter: (params: ValueFormatterParams) => {
            return params.value?.toLocaleString() ?? '';
        },
    };
    const averageColumn: ColDef<IStatItemProcessed> = {
        colId: 'average',
        headerName: t('grid.avg'),
        field: 'row_avg',
        aggFunc: 'avg',
        pinned: 'right',
        width: 100,
        valueFormatter: (params: ValueFormatterParams) => {
            const value = typeof params.value === 'object' && params.value !== null ? params.value.value : params.value;

            if (typeof value !== 'number' || isNaN(value)) {
                return '';
            }

            return Math.round(value).toLocaleString();
        },
    };

    const datesColumns: ColDef<IStatItemProcessed>[] = dates.map((date, index) => ({
        headerName: date,
        field: `day_${index}`,
        aggFunc: 'sum',
        width: 110,
        valueFormatter: (params: ValueFormatterParams) => {
            return params.value?.toLocaleString() ?? '';
        },
    }));

    return [...metadataColumns, ...datesColumns, sumColumn, averageColumn];
}
