import { Button, ButtonGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useI18n } from '../../features/i18n/i18n.context';
import { useTheme } from '../../features/theme/theme.context';
import './page-header.scss';

export interface PageHeaderProps {
    title: string;
    description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const { lang, setLang } = useI18n();

    return (
        <div className='page-header d-flex justify-content-between align-items-center p-3'>
            <OverlayTrigger placement='right' delay={{ show: 250, hide: 400 }} overlay={<Tooltip>{description}</Tooltip>}>
                <h1 className="h3 m-0">{title}</h1>
            </OverlayTrigger>

            <div className="d-flex gap-2">
                <ButtonGroup size="sm">
                    <Button variant={lang === 'en' ? 'primary' : 'outline-primary'} onClick={() => setLang('en')}>EN</Button>
                    <Button variant={lang === 'ru' ? 'primary' : 'outline-primary'} onClick={() => setLang('ru')}>RU</Button>
                </ButtonGroup>

                <Button variant={theme === 'light' ? 'outline-dark' : 'outline-light'} size="sm" onClick={toggleTheme}>
                    {theme === 'light' ? '🌙' : '☀️'}
                </Button>
            </div>
        </div>
    );
}
