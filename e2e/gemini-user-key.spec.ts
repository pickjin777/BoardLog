import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Route } from '@playwright/test';
import { visible } from './helpers';

const SECRET = `AQ.${'ab'.repeat(12)}.key-1`;
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

function fulfill(route: Route, status: number, body: unknown) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function expectAxe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(['color-contrast'])
    .analyze();
  expect(results.violations).toEqual([]);
}

async function expectContrast(page: Page) {
  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  const summary = results.violations
    .flatMap((violation) => violation.nodes.map((node) => node.failureSummary ?? ''))
    .join('\n');
  expect(summary).toBe('');
}

test('a 405 availability response opens the connect guide instead of waiting', async ({ page }) => {
  let released = false;
  await page.route('**/api/scan-games', async (route) => {
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 8000);
      const watch = setInterval(() => {
        if (released) {
          clearTimeout(timer);
          clearInterval(watch);
          resolve();
        }
      }, 20);
    });
    if (!released) await route.fulfill({ status: 405, contentType: 'application/json', body: '{}' });
    else await route.fulfill({ status: 405, contentType: 'application/json', body: '{}' });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const reveal = page.locator('#treasure-reveal');
  if (await reveal.isVisible()) await page.locator('#treasure-skip-btn').click();
  await page.locator('#nav-tab-games').click();
  await page.locator('#games-add-game-btn').click();
  await page.locator('#game-form-open-scan-btn').click();
  await page.locator('#scan-consent-check').check();
  await page.locator('#scan-consent-confirm').click();
  await visible('확인 중', page.locator('#scan-route-check'));
  const started = Date.now();
  await page.locator('#scan-route-connect').click();
  await visible('연결 안내', page.locator('#gemini-key-panel'));
  expect(Date.now() - started).toBeLessThan(3000);
  released = true;
});

test('a personal gemini key stays on the device and reads one photo', async ({ page }) => {
  const leaks: string[] = [];
  let scanPosts = 0;
  let modelsStatus = 401;
  page.on('request', (request) => {
    const url = request.url();
    const body = request.postData() ?? '';
    const header = request.headers()['x-goog-api-key'];
    if (url.includes(SECRET)) leaks.push(url);
    if (body.includes(SECRET)) leaks.push(url);
    if (header && !url.startsWith('https://generativelanguage.googleapis.com/')) leaks.push(url);
  });
  await page.route('**/api/scan-games', (route) => {
    if (route.request().method() === 'POST') scanPosts += 1;
    return fulfill(route, 405, { error: 'missing' });
  });
  await page.route('https://generativelanguage.googleapis.com/**', (route) => {
    const url = route.request().url();
    expect(url).not.toContain(SECRET);
    if (route.request().method() === 'GET') return fulfill(route, modelsStatus, { models: [{}] });
    return fulfill(route, 200, {
      candidates: [{ content: { parts: [{ text: JSON.stringify({ games: [{ title: '카탄', confidence: 0.93 }] }) }] } }]
    });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const reveal = page.locator('#treasure-reveal');
  if (await reveal.isVisible()) await page.locator('#treasure-skip-btn').click();
  await page.locator('#nav-tab-games').click();
  await page.locator('#games-add-game-btn').click();
  await page.locator('#game-form-open-scan-btn').click();
  await page.locator('#scan-consent-check').check();
  await page.locator('#scan-consent-confirm').click();
  await visible('내 제미나이 연결', page.locator('#gemini-key-panel'));
  await expect(page.locator('#gemini-key-panel')).toContainText('키 받으러 가기');
  await expect(page.locator('#gemini-key-panel')).toContainText('구글 계정으로 들어가기');
  await expect(page.locator('#gemini-key-panel')).toContainText('글자 만들기');
  await expect(page.locator('#gemini-key-panel')).toContainText('여기로 돌아와 붙이기');
  await expect(page.locator('#gemini-key-panel')).toContainText('연결 비밀번호');
  await expect(page.locator('#gemini-key-panel')).toContainText('만 18세');
  await expect(page.locator('#gemini-key-help')).toHaveAttribute('href', 'https://aistudio.google.com/apikey');
  await expect(page.locator('#gemini-key-help')).toHaveAttribute('target', '_blank');
  await expectAxe(page);
  await expectContrast(page);

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(async () => navigator.clipboard.writeText('AQ.short'));
  await page.locator('#gemini-key-paste').click();
  await visible('잘린 글자', page.locator('#gemini-key-error'));
  await expect(page.locator('#gemini-key-error')).toContainText('잘린');

  await page.locator('#gemini-key-faq').click();
  await expect(page.locator('#gemini-key-faq-body')).toContainText('돈이 드나요?');
  await expect(page.locator('#gemini-key-faq-body')).toContainText('안전한가요?');
  await expect(page.locator('#gemini-key-faq-body')).toContainText('잊어버렸어요');
  await expect(page.locator('#gemini-key-faq-body')).toContainText('지우고 싶어요');

  await page.evaluate(async (key) => navigator.clipboard.writeText(`\n${key}\n`), SECRET);
  await page.locator('#gemini-key-paste').click();
  await expect(page.locator('#gemini-key-input')).toHaveValue(SECRET);
  await page.locator('#gemini-key-verify').click();
  await visible('틀린 키', page.locator('#gemini-key-error'));
  await expect(page.locator('#gemini-key-error')).toContainText('글자가 안 맞아요');
  await expect(page.locator('#gemini-key-error')).not.toContainText(SECRET);

  modelsStatus = 200;
  await page.locator('#gemini-key-verify').click();
  await visible('연결됨', page.locator('#gemini-key-success'));
  await expect(page.locator('#gemini-key-success')).toContainText('연결됐어요');
  await expect(page.locator('#gemini-key-success')).toContainText('사진을 고르면');
  await page.locator('#gemini-key-success-next').click();
  await visible('연결 후 사진', page.locator('#scan-pick-photos-btn'));
  await page.locator('#scan-file-input').setInputFiles({ name: 'shelf.png', mimeType: 'image/png', buffer: PNG });
  await visible('인식 결과', page.locator('#scan-result-list'));
  await expect(page.locator('input[value="카탄"]')).toBeVisible();
  expect(scanPosts).toBe(0);
  expect(leaks).toEqual([]);

  await page.locator('#scan-modal-close-btn').click();
  await page.locator('#nav-tab-mypage').click();
  await expect(page.locator('#settings-gemini-key-status')).toContainText('연결');
  await page.locator('#settings-gemini-key-clear').click();
  await expect(page.locator('#settings-gemini-key-status')).toContainText('없습니다');
  await expect(page.locator('#settings-gemini-key-clear')).toHaveCount(0);
  await page.locator('#settings-gemini-faq').click();
  await expect(page.locator('#settings-gemini-faq-body')).toContainText('돈이 드나요?');
});
