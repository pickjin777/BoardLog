import { expect, test, type Page } from '@playwright/test';
import { gameRow, playRow, putRows, requireUid, visible } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

async function skipChest(page: Page) {
  const skip = page.locator('#treasure-skip-btn');
  if (await skip.isVisible()) await skip.click();
  await expect(page.locator('#treasure-reveal')).toBeHidden();
}

test('home rails use real games and stay hidden when there is nothing to show', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await skipChest(page);
  await expect(page.locator('#home-rail-recent')).toHaveCount(0);
  await expect(page.locator('#home-rail-neglected')).toHaveCount(0);
  await expect(page.locator('#home-activity-14')).toContainText('최근 14일 · 0회');
  await expect(page.locator('#home-treasure')).toContainText('게임 등록');

  const uid = await requireUid(page);
  await putRows(page, [
    {
      store: 'games',
      row: gameRow({ id: 'rail-recent', userId: uid, title: '최근게임', createdAt: '2026.01.01' })
    },
    {
      store: 'games',
      row: gameRow({ id: 'rail-quiet', userId: uid, title: '묵힌게임', createdAt: '2026.01.01' })
    },
    {
      store: 'plays',
      row: { ...playRow('rail-play-new', uid, 'rail-recent', '최근게임', true), date: '2026.11.12' }
    },
    {
      store: 'plays',
      row: { ...playRow('rail-play-old', uid, 'rail-quiet', '묵힌게임', false), date: '2026.01.02' }
    }
  ]);
  await page.reload({ waitUntil: 'networkidle' });
  await skipChest(page);
  await expect(page.locator('#home-rail-recent')).toContainText('최근게임');
  await expect(page.locator('#home-rail-neglected')).toContainText('묵힌게임');
  await expect(page.locator('#home-rail-neglected')).not.toContainText('최근게임');
  await expect(page.locator('#home-treasure')).toContainText('최근게임');
});

test('a game page shows my stats and stores a one-line memo', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await skipChest(page);
  const uid = await requireUid(page);
  await putRows(page, [
    {
      store: 'games',
      row: gameRow({ id: 'detail-game', userId: uid, title: '상세게임', playCount: 1 })
    },
    {
      store: 'plays',
      row: {
        ...playRow('detail-play', uid, 'detail-game', '상세게임', true),
        date: '2026.11.01',
        durationMinutes: 40
      }
    }
  ]);
  await page.reload({ waitUntil: 'networkidle' });
  await skipChest(page);
  await page.locator('#nav-tab-games').click();
  await page.locator('#game-card-detail-game').click();
  const detail = page.locator('#game-detail-modal-overlay');
  await visible('상세', detail);
  await expect(detail.locator('#game-detail-stats')).toContainText('1회');
  await expect(detail.locator('#game-detail-stats')).toContainText('1승');
  await expect(detail.locator('#game-detail-stats')).toContainText('2026.11.01');
  await page.locator('#game-detail-memo').fill('다음에 확장');
  await page.locator('#game-detail-memo-save').click();
  await expect(page.getByText('메모를 저장했습니다.')).toBeVisible();
  await detail.getByRole('button', { name: '닫기' }).click();
  await page.locator('#game-card-detail-game').click();
  await expect(page.locator('#game-detail-memo')).toHaveValue('다음에 확장');
  await expect(detail.getByRole('button', { name: '수정하기' })).toBeVisible();
  await expect(detail.getByRole('button', { name: '삭제하기' })).toBeVisible();
});

test('a user tag filters the collection', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await skipChest(page);
  await page.locator('#nav-tab-games').click();
  await page.locator('#games-add-game-btn').click();
  await page.locator('#game-input-title').fill('태그게임');
  await page.locator('#game-input-tags').fill('파티, 2인');
  await page.locator('#game-select-ownership').selectOption('하고 싶음');
  await page.locator('#game-form-save-btn').click();
  await skipChest(page);
  await expect(page.getByRole('button', { name: '하고 싶음', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '파티', exact: true }).click();
  await expect(page.getByRole('heading', { name: '태그게임' })).toBeVisible();
  await expect(page.locator('#games-tag-filters')).toContainText('2인');
});
