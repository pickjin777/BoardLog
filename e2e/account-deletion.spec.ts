import { test } from '@playwright/test';
import { check, gameRow, hasText, hidden, putRows, requireUid, visible } from './helpers';

test('deleting the account asks first and clears only this device account', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const uid = await requireUid(page);
  await putRows(page, [{ store: 'games', row: gameRow({ id: 'gone_game', userId: uid, title: '지울게임' }) }]);
  await page.reload({ waitUntil: 'networkidle' });

  await page.locator('#nav-tab-games').click();
  await visible('삭제 전 게임', page.getByText('지울게임'));

  await page.locator('#nav-tab-mypage').click();
  await page.locator('#mypage-delete-account-btn').click();
  const dialog = page.locator('#confirm-modal-overlay');
  await visible('삭제 확인', dialog);
  await hasText('다른 계정은 남긴다고 안내', dialog, '다른 계정은 남습니다');
  await page.locator('#confirm-modal-cancel-btn').click();
  await hidden('확인을 닫음', dialog);

  await page.locator('#nav-tab-games').click();
  await visible('취소 후에는 게임이 남음', page.getByText('지울게임'));

  await page.locator('#nav-tab-mypage').click();
  await page.locator('#mypage-delete-account-btn').click();
  await page.locator('#confirm-modal-action-btn').click();
  await hidden('삭제가 끝나면 확인이 닫힘', dialog);
  await page.locator('#nav-tab-games').click();
  await visible('빈 목록', page.locator('#empty-state-view'));
  check('지운 게임은 목록에 없음', (await page.getByText('지울게임').count()) === 0);
});

test('the public deletion page explains the device account', async ({ page }) => {
  await page.goto('/account-deletion/', { waitUntil: 'networkidle' });
  await visible('삭제 안내 제목', page.getByRole('heading', { name: '보드로그 계정 삭제' }));
  await hasText('서버 계정이 없음을 밝힘', page.locator('main'), '서버 계정으로 저장되지 않습니다');
  await hasText('앱에서 지우는 위치', page.locator('main'), '계정과 이 기기의 기록 삭제');
});
