import { IStatItemProcessed, IStatItemRaw, StatMetricType, WorkerMessage } from '../types/stats.types';

const DAYS_WINDOW = 30;

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const { action, payload } = event.data;

    if (action === 'processData') {
        const result = processData(payload.raw, payload.metric);
        self.postMessage({ action: 'dataProcessed', payload: result });
    }
};

const msPerDay = 24 * 60 * 60 * 1000;

export function processData(items: IStatItemRaw[], metric: StatMetricType): { processedData: IStatItemProcessed[]; dates: string[] } {
    const now = new Date();

    const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

    const processedData = items.map((item, index) => {
        const dataValues = calculateMetricValues(item, metric);

        const lastUpdateDate = new Date(item.lastUpdate);

        const lastUpdateUtc = Date.UTC(lastUpdateDate.getFullYear(), lastUpdateDate.getMonth(), lastUpdateDate.getDate());

        const diffDays = Math.floor((todayUtc - lastUpdateUtc) / msPerDay);

        const processedItemBase = createBaseProcessedItem(item, index);

        const alignedStats = alignDataToWindow(dataValues, diffDays);

        return {
            ...processedItemBase,
            ...alignedStats,
        } as IStatItemProcessed;
    });

    const dates = Array.from({ length: DAYS_WINDOW }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        d.setDate(d.getDate() - i);

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    });

    return { processedData, dates };
}

function calculateMetricValues(item: IStatItemRaw, metric: StatMetricType): number[] {
    if (metric === 'cost') return item.cost;
    if (metric === 'orders') return item.orders;
    if (metric === 'returns') return item.returns;

    const buyouts = item.orders.map((order, i) => order - (item.returns[i] || 0));

    if (metric === 'buyouts') return buyouts;

    if (metric === 'revenue') {
        return item.cost.map((c, i) => c * buyouts[i]);
    }

    return [];
}

function createBaseProcessedItem(item: IStatItemRaw, index: number): Omit<IStatItemProcessed, 'day_X' | 'row_sum' | 'row_avg'> {
    return {
        id: `${item.supplier}_${item.brand}_${item.article}_${index}`,
        type: item.type,
        article: item.article,
        brand: item.brand,
        supplier: item.supplier,
    };
}

function alignDataToWindow(dataValues: number[], diffDays: number): { [key: string]: number; row_sum: number; row_avg: number } {
    const alignedData: { [key: string]: number } = {};
    let rowSum = 0;
    let count = 0;

    for (let targetDayIndex = 0; targetDayIndex < DAYS_WINDOW; targetDayIndex++) {
        const sourceIndex = targetDayIndex - diffDays;
        let value = 0;

        if (sourceIndex >= 0 && sourceIndex < dataValues.length) {
            value = dataValues[sourceIndex];
        }

        alignedData[`day_${targetDayIndex}`] = value;
        rowSum += value;
        count++;
    }

    return {
        ...alignedData,
        row_sum: rowSum,
        row_avg: count > 0 ? rowSum / count : 0,
    };
}
