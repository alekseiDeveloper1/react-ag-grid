import { PageHeader, PageHeaderProps } from '../page-header/page-header';
import './page-wrapper.scss';

type Props = React.PropsWithChildren<PageHeaderProps>;

export function PageWrapper({ children, ...pageHeaderProps }: Props) {
    return (
        <div className='page-wrapper'>
            <PageHeader {...pageHeaderProps} />
            <div className='page-wrapper-content'>{children}</div>
        </div>
    );
}
