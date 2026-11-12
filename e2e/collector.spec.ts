import { expect, test, type Page } from '@playwright/test';
import { visible } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

async function skipChest(page: Page) {
  const skip = page.locator('#treasure-skip-btn');
  if (await skip.isVisible()) await skip.click();
  await expect(page.locator('#treasure-reveal')).toBeHidden();
}

async function registerGameAndPlay(page: Page, title: string) {
  await page.locator('#nav-tab-games').click();
  await page.locator('#games-add-game-btn').click();
  await page.locator('#game-input-title').fill(title);
  await page.locator('#game-form-save-btn').click();
  await visible('게임 상자', page.locator('#treasure-reveal'));
  await expect(page.locator('#treasure-reveal')).toHaveAttribute('data-kind', 'acquire');
  await skipChest(page);

  await page.locator('#nav-tab-home').click();
  await page.locator('#dashboard-add-play-cta').click();
  const overlay = page.locator('#play-record-modal-overlay');
  await page.locator('#play-game-search-input').fill(title);
  await overlay.getByText(title, { exact: true }).first().click();
  await overlay.locator('button[title="승자 토글"]').nth(0).click();
  await page.locator('#play-form-save-btn').click();
  await page.getByRole('button', { name: '다음에 할게요' }).click();
}

test('saving a play levels up and completes the new-game quest', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await skipChest(page);
  await registerGameAndPlay(page, '레벨테스트');

  const reveal = page.locator('#treasure-reveal');
  await visible('레벨 상자', reveal);
  await expect(reveal).toHaveAttribute('data-kind', 'level');
  await visible('레벨 문구', reveal.getByText('레벨이 올랐습니다'));
  await skipChest(page);

  await page.locator('#home-open-quests').click();
  const quest = page.locator('[data-quest="week-new"]');
  await expect(quest).toHaveAttribute('data-quest-state', 'done');
  await expect(quest).toContainText('완료');
  await page.locator('#collector-close').click();

  await page.locator('#nav-tab-mypage').click();
  const badge = page.locator('[data-badge="week-new"]');
  await expect(badge).toHaveAttribute('data-badge-state', 'earned');
  await expect(badge).toContainText('획득');
  await expect(page.locator('#home-level-track')).toHaveCount(0);
});

test('reduced motion keeps the level-up chest still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });
  await skipChest(page);
  await registerGameAndPlay(page, '모션테스트');

  const reveal = page.locator('#treasure-reveal');
  await visible('줄어든 레벨 상자', reveal);
  await expect(reveal).toHaveAttribute('data-kind', 'level');
  await expect(reveal).toHaveAttribute('data-reduced', 'true');
  const animation = await reveal.locator('.treasure-lid').evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe('none');
  await skipChest(page);
});
