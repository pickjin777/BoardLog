import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { visible } from './helpers';

async function skipChest(page: Page) {
  const reveal = page.locator('#treasure-reveal');
  if (await reveal.isVisible()) await page.locator('#treasure-skip-btn').click();
  await expect(reveal).toBeHidden();
}

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

test('the chest is announced and dismissed from the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const skip = page.locator('#treasure-skip-btn');
  await expect(skip).toBeFocused();
  await expect(skip).toHaveAttribute('aria-label', '보물상자가 열립니다. 건너뛰기');
  await expect(page.locator('.treasure-chest-svg')).toHaveAttribute('aria-hidden', 'true');
  await page.keyboard.press('Tab');
  const next = await page.evaluate(() => document.activeElement?.id ?? document.activeElement?.tagName);
  expect(next).not.toBe('treasure-skip-btn');
  await page.keyboard.press('Shift+Tab');
  await expect(skip).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#treasure-reveal')).toBeHidden();
});

test('main screens meet axe and 48px targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await skipChest(page);

  await expectAxe(page, 'home');
  await expectContrast(page, 'home contrast');
  await expectTouchTargets(page, 'home targets');

  await page.locator('#nav-tab-games').click();
  await visible('게임 탭', page.locator('#games-tab-title'));
  await expectAxe(page, 'games');
  await expectContrast(page, 'games contrast');
  await expectTouchTargets(page, 'games targets');

  await page.locator('#games-add-game-btn').click();
  await visible('게임 폼', page.locator('#game-form-modal-overlay'));
  await expectAxe(page, 'game form');
  await expectContrast(page, 'game form contrast');
  await expectTouchTargets(page, 'game form targets');
  await page.locator('#game-form-open-scan-btn').click();
  await visible('사진 시트', page.locator('#scan-modal-sheet'));
  await expectAxe(page, 'photo sheet');
  await expectContrast(page, 'photo sheet contrast');
  await expectTouchTargets(page, 'photo sheet targets');
  await page.locator('#scan-modal-close-btn').click();

  await page.locator('#nav-tab-plays').click();
  await expectAxe(page, 'plays');
  await expectTouchTargets(page, 'plays targets');

  await page.locator('#nav-tab-mypage').click();
  await expectAxe(page, 'my page');
  await expectContrast(page, 'my page contrast');
  await expectTouchTargets(page, 'my page targets');
});

test('kakao, catalog, play form, and login meet axe and contrast', async ({ page }) => {
  await page.route(/kakao|kakaocdn|kakaolink/i, (route) => route.abort());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await skipChest(page);

  await page.locator('#nav-tab-games').click();
  await page.locator('#games-add-game-btn').click();
  await page.locator('#game-input-title').fill('대비확인');
  await page.locator('#game-form-save-btn').click();
  await skipChest(page);
  await page.locator('#games-kakao-share-btn').click();
  await visible('카카오 시트', page.locator('#kakao-share-modal-overlay'));
  await expectAxe(page, 'kakao');
  await expectContrast(page, 'kakao contrast');
  await expectTouchTargets(page, 'kakao targets');
  await page.getByRole('button', { name: '2. 카카오톡 미리보기' }).click();
  await expectAxe(page, 'kakao preview');
  await expectContrast(page, 'kakao preview contrast');
  await page.locator('#kakao-share-modal-overlay button[aria-label="닫기"]').click();

  await page.locator('#games-print-catalog-btn').click();
  await visible('도록', page.locator('#game-catalog-modal-overlay'));
  await expectAxe(page, 'catalog');
  await expectContrast(page, 'catalog contrast');
  await expectTouchTargets(page, 'catalog targets');
  await page.locator('#game-catalog-modal-overlay button[aria-label="닫기"]').click();

  await page.locator('#nav-fab-add-play').click();
  await visible('기록 폼', page.locator('#play-record-modal-overlay'));
  await expectAxe(page, 'play form');
  await expectContrast(page, 'play form contrast');
  await expectTouchTargets(page, 'play form targets');
  await page.locator('#play-record-modal-overlay button[aria-label="닫기"]').click();

  await page.locator('#header-user-profile-btn').click();
  await visible('로그인', page.locator('#auth-modal-backdrop'));
  await expectAxe(page, 'login');
  await expectContrast(page, 'login contrast');
  await expectTouchTargets(page, 'login targets');
});
