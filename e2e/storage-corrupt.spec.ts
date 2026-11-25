import { expect, test } from '@playwright/test';

test('a broken local game list is shown as an error and is not overwritten', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '오늘 플레이한 게임을 기록하세요' })).toBeVisible();

  await page.evaluate(() => {
    const raw = localStorage.getItem('boardlog_active_user');
    const uid = raw ? (JSON.parse(raw) as { uid: string }).uid : '';
    localStorage.setItem(`boardlog_games_${uid}`, '{');
    localStorage.setItem('boardlog_corrupt_probe_uid', uid);
  });

  await page.reload();
  await expect(page.getByText('잘못된 내용은 덮어쓰지 않았습니다.')).toBeVisible();

  const kept = await page.evaluate(() => {
    const uid = localStorage.getItem('boardlog_corrupt_probe_uid');
    return localStorage.getItem(`boardlog_games_${uid}`);
  });
  expect(kept).toBe('{');
});
