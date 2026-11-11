import { expect, test } from '@playwright/test';
import { gameRow, playRow, putRows, requireUid, visible } from './helpers';

async function skipChest(page: import('@playwright/test').Page) {
  const reveal = page.locator('#treasure-reveal');
  if (await reveal.isVisible()) await page.locator('#treasure-skip-btn').click();
  await expect(reveal).toBeHidden();
}

test('back dismisses the chest, then a form, without leaving the app', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#treasure-reveal')).toBeVisible();
  await page.goBack();
  await expect(page.locator('#treasure-reveal')).toBeHidden();
  await expect(page.locator('#top-app-header')).toBeVisible();

  await page.locator('#nav-tab-games').click();
  await page.locator('#games-add-game-btn').click();
  await expect(page.locator('#game-form-modal-overlay')).toBeVisible();
  await page.goBack();
  await expect(page.locator('#game-form-modal-overlay')).toBeHidden();
  await expect(page.locator('#games-tab-title')).toBeVisible();
});

test('empty collection, then add, edit, and delete a game', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await skipChest(page);
  await page.locator('#nav-tab-games').click();
  await visible('빈 게임 목록', page.locator('#empty-state-view'));

  await page.locator('#games-add-game-btn').click();
  await page.locator('#game-input-title').fill('첫 게임');
  await page.locator('#game-form-save-btn').click();
  await skipChest(page);
  await visible('추가된 게임', page.getByRole('heading', { name: '첫 게임' }));

  await page.getByRole('button', { name: '첫 게임 열기' }).click();
  await page.getByRole('button', { name: '정보 수정' }).click();
  await page.locator('#game-input-title').fill('고친 게임');
  await page.locator('#game-form-save-btn').click();
  await visible('수정된 제목', page.getByRole('heading', { name: '고친 게임' }));

  await page.getByRole('button', { name: '고친 게임 열기' }).click();
  await page.locator('#game-detail-delete-btn').click();
  await page.locator('#confirm-modal-action-btn').click();
  await expect(page.getByRole('heading', { name: '고친 게임' })).toHaveCount(0);
  await visible('다시 빈 목록', page.locator('#empty-state-view'));
});

test('a play record can be deleted from its detail', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const uid = await requireUid(page);
  await putRows(page, [
    { store: 'games', row: gameRow({ id: 'game_del', userId: uid, title: '삭제용게임' }) },
    { store: 'plays', row: playRow('play_del', uid, 'game_del', '삭제용게임', true) }
  ]);
  await page.reload({ waitUntil: 'networkidle' });
  await skipChest(page);
  await page.locator('#nav-tab-plays').click();
  await page.locator('#play-card-play_del').click();
  await page.getByRole('button', { name: '기록 삭제' }).click();
  await page.locator('#confirm-modal-action-btn').click();
  await expect(page.locator('#play-card-play_del')).toHaveCount(0);
  await visible('빈 기록', page.locator('#empty-state-view'));
});

test('offline still saves a typed game', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await skipChest(page);
  await context.setOffline(true);
  await page.locator('#nav-tab-games').click();
  await page.locator('#games-add-game-btn').click();
  await page.locator('#game-input-title').fill('오프라인게임');
  await page.locator('#game-form-save-btn').click();
  await skipChest(page);
  await visible('오프라인 저장', page.getByRole('heading', { name: '오프라인게임' }));
  await context.setOffline(false);
});
