import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import './lib/ag-grid.tsx';
import { ThemeProvider } from './features/theme/theme.context.tsx';
import { I18nProvider } from './features/i18n/i18n.context.tsx';
import { ErrorBoundary } from 'react-error-boundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Root element with ID "root" not found in the document.');
}
ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <I18nProvider>
                    <ErrorBoundary fallback={<div>Something went wrong</div>}>
                        <App />
                    </ErrorBoundary>
                </I18nProvider>
            </ThemeProvider>
        </BrowserRouter>
    </React.StrictMode>,
);
