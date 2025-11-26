export enum Metrics {
    cost = 'cost',
    orders = 'orders',
    returns = 'returns',

    revenue = 'revenue',
    buyouts = 'buyouts',
}

export function isMetric(value: string): value is Metrics {
    return Object.values(Metrics).includes(value as Metrics);
}
