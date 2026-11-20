import { test } from '@playwright/test';
import { check, gameRow, hasText, hidden, playRow, putRows, requireUid, visible } from './helpers';

test('records-stay-on-device notice leads to JSON backup', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });

  await visible('기기 저장 안내', page.locator('#local-storage-notice'));
  await hasText('안내가 유실을 말함', page.locator('#local-storage-notice'), '이 기기의 브라우저에만');
  await hasText('헤더는 클라우드 로그인이 아님', page.locator('#header-user-profile-btn'), '이 기기');

  await page.locator('#local-storage-backup-btn').click();
  await visible('JSON 백업 버튼으로 이동', page.locator('#export-json-btn'));
});

test('320px games title stays wide and the 390px empty hint clears the tab', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const kpi = await page.locator('#home-kpi-games').boundingBox();
  const fab = await page.locator('#nav-fab-add-play').boundingBox();
  check(
    '320px에서 보유 게임 수치가 기록 추가 버튼에 가리지 않음',
    !!kpi && !!fab && kpi.y + kpi.height <= fab.y - 1,
    JSON.stringify({ kpi, fab })
  );
  await page.locator('#nav-tab-games').click();
  await page.locator('#games-tab-title').waitFor();

  const title = await page.locator('#games-tab-title').boundingBox();
  const add = await page.locator('#games-add-game-btn').boundingBox();
  check(
    '320px에서 제목이 버튼 위에 넓게 있음',
    !!title && !!add && title.width > 200 && add.y >= title.y + title.height - 1,
    JSON.stringify({ title, add })
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#nav-tab-home').click();
  const hint = await page.locator('#home-empty-add-play-btn').boundingBox();
  const nav = await page.locator('#bottom-navigation-bar').boundingBox();
  check(
    '390px에서 빈 기록 버튼이 하단 탭에 가리지 않음',
    !!hint && !!nav && hint.y + hint.height <= nav.y + 1,
    JSON.stringify({ hint, nav })
  );
});

test('photo scan stays off until the server says a key exists', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#nav-tab-games').click();
  await page.locator('#games-add-game-btn').click();
  await visible('키 없으면 준비 중 안내', page.locator('#game-form-scan-unavailable'));
  await hidden('키 없으면 스캔 버튼 없음', page.locator('#game-form-open-scan-btn'));
  await hasText('시드 검색은 그대로', page.locator('#game-form-modal-overlay'), '시드 검색');
  await page.locator('#game-form-close-btn').click();

  await page.route('**/api/scan-games', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ available: true })
      });
      return;
    }
    route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"no photo"}' });
  });

  await page.locator('#games-add-game-btn').click();
  await visible('키가 생기면 스캔 버튼', page.locator('#game-form-open-scan-btn'));
  await hidden('준비 중 안내가 사라짐', page.locator('#game-form-scan-unavailable'));
});

test('kakao quick select keeps weight, and game detail lists only that game', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const uid = await requireUid(page);
  await putRows(page, [
    {
      store: 'games',
      row: gameRow({
        id: 'game_light',
        userId: uid,
        title: '라이트합성',
        weight: 1.2,
        minPlayers: 2,
        maxPlayers: 4,
        genre: ['전략']
      })
    },
    {
      store: 'games',
      row: gameRow({
        id: 'game_heavy',
        userId: uid,
        title: '헤비합성',
        weight: 4.2,
        minPlayers: 2,
        maxPlayers: 4,
        genre: ['전략']
      })
    },
    {
      store: 'plays',
      row: { ...playRow('play_heavy', uid, 'game_heavy', '헤비합성', true), location: '합성 장소' }
    },
    {
      store: 'plays',
      row: { ...playRow('play_light', uid, 'game_light', '라이트합성', false), location: '다른 장소' }
    }
  ]);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#nav-tab-games').click();
  await page.locator('#games-kakao-share-btn').click();
  await page.locator('#kakao-share-modal-overlay').waitFor();
  await page
    .locator('select')
    .filter({ has: page.locator('option[value="heavy"]') })
    .selectOption('heavy');
  await page.getByRole('button', { name: '2인 추천/전용' }).click();
  await visible('헤비만 선택됨', page.getByText('1/2개 선택됨'));

  await page.locator('#kakao-share-modal-overlay').getByRole('button', { name: '닫기' }).click();
  await hidden('카카오 모달 닫힘', page.locator('#kakao-share-modal-overlay'));

  await page.locator('#game-card-game_heavy').click();
  const detail = page.locator('#game-detail-modal-overlay');
  await visible('이 게임 기록', detail.locator('#game-detail-play-list'));
  await hasText('연결된 기록의 장소', detail, '합성 장소');
  await hasText('기록 수', detail, '이 게임 기록 1회');
  const detailText = (await detail.textContent()) ?? '';
  check('다른 게임 장소는 상세에 없음', !detailText.includes('다른 장소'));
});
