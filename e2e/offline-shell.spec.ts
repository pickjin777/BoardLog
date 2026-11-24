import { expect, test } from '@playwright/test';

test('offline reload shows the last app shell and does not cache API responses', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });

  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const registration = await navigator.serviceWorker?.getRegistration();
          if (!registration?.active) return 'no-worker';
          const cache = await caches.open('boardlog-shell-v1');
          const urls = (await cache.keys()).map((key) => key.url);
          return urls.some((url) => url.includes('/assets/') && url.endsWith('.js')) ? 'ready' : 'no-asset';
        }),
      { timeout: 20_000 }
    )
    .toBe('ready');

  await page.evaluate(async () => {
    await fetch('/api/scan-games').catch(() => undefined);
    const stale = await caches.open('boardlog-shell-v0');
    await stale.put('/old-shell', new Response('stale'));
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  });

  await page.reload({ waitUntil: 'networkidle' });

  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const names = await caches.keys();
          const urls: string[] = [];
          for (const name of names) {
            const cache = await caches.open(name);
            for (const key of await cache.keys()) urls.push(key.url);
          }
          return {
            droppedOld: !names.includes('boardlog-shell-v0'),
            hasAsset: urls.some((url) => url.includes('/assets/') && url.endsWith('.js')),
            cachedApi: urls.some((url) => url.includes('/api/'))
          };
        }),
      { timeout: 20_000 }
    )
    .toEqual({ droppedOld: true, hasAsset: true, cachedApi: false });

  await page.context().setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#top-app-header')).toContainText('보드로그');
  await expect(page.locator('#bottom-navigation-bar')).toBeVisible();
  await expect(page.getByText('ERR_INTERNET_DISCONNECTED')).toHaveCount(0);
});
