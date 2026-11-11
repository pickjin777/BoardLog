import { expect, test } from '@playwright/test';
import { check, visible } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('the chest opens on entry and skip leaves the home actions usable', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const reveal = page.locator('#treasure-reveal');
  await visible('입장 상자', reveal);
  await visible('입장 문구', reveal.getByText('보물상자가 열립니다'));
  const skip = page.locator('#treasure-skip-btn');
  const box = await skip.boundingBox();
  check('건너뛰기 터치 너비', (box?.width ?? 0) >= 44, String(box?.width));
  check('건너뛰기 터치 높이', (box?.height ?? 0) >= 44, String(box?.height));

  await page.keyboard.press('Escape');
  await expect(reveal).toBeHidden();

  await page.locator('#dashboard-add-play-cta').click();
  await visible('건너뛴 뒤 기록 폼', page.locator('#play-form-save-btn'));
});

test('reduced motion shows a still open chest', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });
  const reveal = page.locator('#treasure-reveal');
  await visible('줄어든 모션 상자', reveal);
  check('줄어든 모션 표시', (await reveal.getAttribute('data-reduced')) === 'true');
  const animation = await reveal.locator('.treasure-lid').evaluate((el) => getComputedStyle(el).animationName);
  check('뚜껑 애니메이션 없음', animation === 'none', animation);
  await page.locator('#treasure-skip-btn').click();
  await expect(reveal).toBeHidden();
});

test('saving a new game opens the chest again', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#treasure-skip-btn').click();
  await page.locator('#nav-tab-games').click();
  await page.locator('#games-add-game-btn').click();
  await page.locator('#game-input-title').fill('보물상자테스트');
  await page.locator('#game-form-save-btn').click();
  const reveal = page.locator('#treasure-reveal');
  await visible('추가 상자', reveal);
  await visible('추가 문구', reveal.getByText('새 게임이 들어왔습니다'));
  check('추가 순간', (await reveal.getAttribute('data-kind')) === 'acquire');
  await page.locator('#treasure-skip-btn').click();
  await expect(reveal).toBeHidden();
  await visible('추가된 게임', page.getByRole('heading', { name: '보물상자테스트' }));
});
