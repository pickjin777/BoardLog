import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { VercelAnalytics } from './components/VercelAnalytics.tsx';
import './index.css';
import { initAnalytics } from './services/analytics.ts';

initAnalytics();
registerOfflineShell();

/**
 * Production builds only. The first visit is not controlled yet, so after the worker
 * is ready we hand it the URLs this page already loaded. /api is filtered in the worker.
 */
function registerOfflineShell(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        const urls = performance
          .getEntriesByType('resource')
          .map((entry) => entry.name)
          .concat([`${window.location.origin}/`]);
        registration.active?.postMessage({ type: 'cache-urls', urls });
      })
      .catch(() => {
        // A missing shell must not block recording a play.
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

createRoot(rootElement).render(
  <StrictMode>
    <App />
    <VercelAnalytics />
  </StrictMode>
);
