import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import './lib/ag-grid.tsx';
import { ThemeProvider } from './features/theme/theme.context.tsx';
import { I18nProvider } from './features/i18n/i18n.context.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <I18nProvider>
                    <App />
                </I18nProvider>
            </ThemeProvider>
        </BrowserRouter>
    </React.StrictMode>,
);