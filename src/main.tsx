import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary, PreviewCrash } from './components/ErrorBoundary.tsx';
import { VercelAnalytics } from './components/VercelAnalytics.tsx';
import './index.css';
import { initAnalytics } from './services/analytics.ts';
import { isNativeShell, shouldRegisterOfflineShell } from './utils/nativeShell.ts';

initAnalytics();
startShell();

function startShell(): void {
  const native = isNativeShell();
  if (shouldRegisterOfflineShell(import.meta.env.PROD, native)) {
    registerOfflineShell();
    return;
  }
  if (!native) return;
  unregisterOfflineShell();
  // Both compares are build-time constants. A default package drops the plugin chunks (D-048).
  if (
    __BOARDLOG_MONETIZATION_PACKAGE__ &&
    (import.meta.env.VITE_ADMOB_ENABLED === 'true' || import.meta.env.VITE_PLAY_BILLING_ENABLED === 'true')
  ) {
    void import('./services/nativeMonetization.ts').then((mod) => mod.prepareNativeMonetization());
  }
}

function unregisterOfflineShell(): void {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      for (const registration of registrations) {
        void registration.unregister();
      }
    })
    .catch(() => {
      // A leftover worker must not block the native shell.
    });
}

function registerOfflineShell(): void {
  // Production web only. The caller already checked the native shell.
  // The first visit is not controlled yet, so after the worker is ready we hand it
  // the URLs this page already loaded. /api is filtered in the worker.
  if (!('serviceWorker' in navigator)) return;
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
    <ErrorBoundary>
      <PreviewCrash />
      <App />
      <VercelAnalytics />
    </ErrorBoundary>
  </StrictMode>
);
