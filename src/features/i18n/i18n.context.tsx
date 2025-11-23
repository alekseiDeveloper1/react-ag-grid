import { createContext, useContext, useState, PropsWithChildren } from 'react';
import { resources, TranslationKey } from './resources';

type Lang = 'en' | 'ru';

interface I18nContextType {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
    const [lang, setLang] = useState<Lang>('en');

    const t = (key: TranslationKey) => {
        return resources[lang][key] || key;
    };

    return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) throw new Error('useI18n must be used within I18nProvider');
    return context;
}