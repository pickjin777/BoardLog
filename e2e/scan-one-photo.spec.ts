import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Route } from '@playwright/test';
import { visible } from './helpers';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const SHELF = {
  games: [
    { title: '카탄', confidence: 0.95 },
    { title: 'Splendor', confidence: 0.88 },
    { title: '없는게임', confidence: 0.55 },
    { title: '카탄', confidence: 0.2 }
  ]
};

async function expectAxe(page: Page, name: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(['color-contrast'])
    .analyze();
  const summary = results.violations
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`)
    .join('\n');
  expect(results.violations, `${name}\n${summary}`).toEqual([]);
}

async function expectContrast(page: Page, name: string) {
  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  const summary = results.violations
    .flatMap((violation) => violation.nodes.map((node) => `${node.target.join(' ')} — ${node.failureSummary}`))
    .join('\n');
  expect(summary, name).toBe('');
}

async function expectTouchTargets(page: Page, name: string) {
  const small = await page.locator('button, a, input, select, textarea, [role="button"]').evaluateAll((elements) =>
    elements.flatMap((element) => {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') return [];
      const hit =
        element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio')
          ? (element.closest('label') ?? element)
          : element;
      const box = hit.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) return [];
      if (box.width >= 48 && box.height >= 48) return [];
      const label =
        element.getAttribute('aria-label') || element.textContent?.replace(/\s+/g, ' ').trim() || element.id;
      return [
        `${Math.round(box.width)}x${Math.round(box.height)} ${element.tagName}#${element.id} ${label?.slice(0, 40)}`
      ];
    })
  );
  expect(small, name).toEqual([]);
}

async function openScanPicker(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const reveal = page.locator('#treasure-reveal');
  if (await reveal.isVisible()) await page.locator('#treasure-skip-btn').click();
  await page.locator('#nav-tab-games').click();
  await page.locator('#games-add-game-btn').click();
  await page.locator('#game-form-open-scan-btn').click();
  await page.locator('#scan-consent-check').check();
  await page.locator('#scan-consent-confirm').click();
  await visible('사진 한 장', page.locator('#scan-pick-photos-btn'));
}

function fulfillJson(route: Route, status: number, body: unknown) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

test('one photo adds the chosen games and leaves the wrong one out', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  let posted = 0;
  let imageCount = 0;
  await page.route('**/api/scan-games', (route) => {
    if (route.request().method() === 'GET') return fulfillJson(route, 200, { available: true });
    posted += 1;
    imageCount = ((route.request().postDataJSON() as { images?: unknown[] } | null)?.images ?? []).length;
    return fulfillJson(route, 200, SHELF);
  });

  await openScanPicker(page);
  await expect(page.locator('#scan-consent-dialog')).toBeHidden();
  await expect(page.locator('#scan-pick-photos-btn')).toContainText('1장');
  await expect(page.locator('#scan-file-input')).not.toHaveAttribute('multiple', '');
  await expectAxe(page, 'photo picker');
  await expectContrast(page, 'photo picker contrast');
  await expectTouchTargets(page, 'photo picker targets');

  await page.locator('#scan-file-input').setInputFiles({ name: 'shelf.png', mimeType: 'image/png', buffer: PNG });
  await visible('인식 목록', page.locator('#scan-result-list'));
  await expect(page.locator('#scan-result-list input')).toHaveCount(3);
  await expect(page.locator('input[value="카탄"]')).toHaveCount(1);
  await expect(page.locator('input[value="스플렌더"]')).toHaveCount(1);
  await expect(page.locator('input[value="없는게임"]')).toHaveCount(1);
  await expect(page.locator('#scan-result-summary')).toContainText('일부만 목록과 맞았습니다');
  await expect(page.locator('#scan-photo-preview')).toBeVisible();
  expect(posted).toBe(1);
  expect(imageCount).toBe(1);
  await expectAxe(page, 'scan results');
  await expectContrast(page, 'scan results contrast');
  await expectTouchTargets(page, 'scan results targets');

  const wrong = page.locator('#scan-result-list li').filter({ has: page.locator('input[value="없는게임"]') });
  await wrong.locator('button').click();
  await expect(wrong.locator('button')).toHaveAttribute('aria-pressed', 'false');

  await page.locator('#scan-add-manual-btn').click();
  await page.locator('#scan-result-list input').last().fill('직접추가게임');
  await page.locator('#scan-register-btn').click();

  const reveal = page.locator('#treasure-reveal');
  if (await reveal.isVisible()) await page.locator('#treasure-skip-btn').click();
  await visible('카탄 등록', page.getByRole('heading', { name: '카탄' }));
  await visible('스플렌더 등록', page.getByRole('heading', { name: '스플렌더' }));
  await visible('직접 입력 등록', page.getByRole('heading', { name: '직접추가게임' }));
  await expect(page.getByRole('heading', { name: '없는게임' })).toHaveCount(0);
  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
});

test('an empty read and a failed read stay on the one photo', async ({ page }) => {
  let mode: 'empty' | 'fail' = 'empty';
  await page.route('**/api/scan-games', (route) => {
    if (route.request().method() === 'GET') return fulfillJson(route, 200, { available: true });
    if (mode === 'fail') {
      return fulfillJson(route, 502, { error: 'gemini-2.5-flash exploded', code: 'SCAN_FAILED' });
    }
    return fulfillJson(route, 200, { games: [] });
  });

  await openScanPicker(page);
  await page.locator('#scan-file-input').setInputFiles({ name: 'empty.png', mimeType: 'image/png', buffer: PNG });
  await visible('빈 결과', page.locator('#scan-empty-result'));
  await expect(page.locator('#scan-empty-result')).toContainText('찾지 못했습니다');
  await expect(page.locator('#scan-result-list')).toHaveCount(0);
  await page.locator('#scan-add-manual-btn').click();
  await page.locator('#scan-title-manual_1').fill('빈사진수기');
  await expect(page.locator('#scan-result-summary')).toContainText('목록에 없습니다');

  mode = 'fail';
  await page.locator('#scan-file-input').setInputFiles({ name: 'fail.png', mimeType: 'image/png', buffer: PNG });
  await visible('실패', page.locator('#scan-error'));
  await expect(page.locator('#scan-error')).toContainText('사진 인식을 끝내지 못했습니다');
  await expect(page.locator('#scan-error')).not.toContainText('gemini');
  await expect(page.locator('#scan-pick-photos-btn')).toBeVisible();
});
