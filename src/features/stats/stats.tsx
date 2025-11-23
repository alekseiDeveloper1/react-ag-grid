import { PageWrapper } from '../../components/page-wrapper/page-wrapper';
import { StatsMetricSelector } from './metric-selector/stats-metric-selector';
import { StatsGrid } from './stats-grid/stats-grid';
import { useI18n } from '../i18n/i18n.context';

export function Stats() {
    const { t } = useI18n();
    return (
        <PageWrapper title={t('page.title')} description={t('page.description')}>
            <StatsMetricSelector />
            <StatsGrid />
        </PageWrapper>
    );
}
