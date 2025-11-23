import { useMemo } from 'react';
import { Form } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { isMetric, Metrics } from '../stats.const';
import { useI18n } from '../../i18n/i18n.context';
import { TranslationKey } from '../../i18n/resources';
export function StatsMetricSelector() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { t } = useI18n();

    const metricSearchParam = searchParams.get('metric');
    const value = useMemo(() => (metricSearchParam && isMetric(metricSearchParam) ? metricSearchParam : Metrics.cost), [metricSearchParam]);

    const options = Object.values(Metrics).map(m => ({
        value: m,
        label: t(`metric.${m}` as TranslationKey)
    }));

    return (
        <Form.Select
            name='metric'
            size='sm'
            value={value}
            onChange={(e) => {
                setSearchParams({ metric: e.target.value });
            }}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </Form.Select>
    );
}
