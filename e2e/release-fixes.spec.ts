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

test('320px empty lists clear the center button, and controls have names', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#nav-tab-games').click();
  await page.locator('#empty-state-view').waitFor();

  const overlapsFab = async (selector: string) =>
    page.evaluate((sel) => {
      const item = document.querySelector(sel)?.getBoundingClientRect();
      const fab = document.querySelector('#nav-fab-add-play')?.getBoundingClientRect();
      if (!item || !fab) return true;
      const x = Math.min(item.right, fab.right) - Math.max(item.left, fab.left);
      const y = Math.min(item.bottom, fab.bottom) - Math.max(item.top, fab.top);
      return x > 1 && y > 1;
    }, selector);

  check('320 게임 빈 목록 설명이 기록 추가와 안 겹침', !(await overlapsFab('#empty-state-description')));
  check('320 게임 빈 목록 버튼이 기록 추가와 안 겹침', !(await overlapsFab('#empty-state-action-btn')));
  const actionBox = await page.locator('#empty-state-action-btn').boundingBox();
  check(
    '320 게임 빈 목록 버튼이 화면 안에 있음',
    !!actionBox && actionBox.y >= 0 && actionBox.y + actionBox.height <= 700,
    JSON.stringify(actionBox)
  );
  await visible('게임 검색 이름', page.getByRole('textbox', { name: '게임 검색' }));
  await visible('격자 보기 이름', page.getByRole('button', { name: '격자 보기' }));

  await page.waitForFunction(() => {
    const tab = document.querySelector('#nav-tab-home');
    return tab !== null && getComputedStyle(tab).color === 'rgb(99, 110, 114)';
  });
  const navColor = await page.locator('#nav-tab-home').evaluate((el) => getComputedStyle(el).color);
  check('선택 안 된 탭 글자색이 #636E72', navColor === 'rgb(99, 110, 114)', navColor);

  await page.locator('#nav-tab-plays').evaluate((el) => {
    if (!(el instanceof HTMLElement)) return;
    el.focus({ focusVisible: true } as FocusOptions);
  });
  await page.waitForFunction(() => {
    const tab = document.querySelector('#nav-tab-plays');
    return tab !== null && getComputedStyle(tab).outlineColor === 'rgb(72, 52, 212)';
  });
  const outline = await page.locator('#nav-tab-plays').evaluate((el) => getComputedStyle(el).outlineColor);
  check('탭 포커스 테두리가 보임', outline === 'rgb(72, 52, 212)', outline);

  await page.locator('#nav-tab-plays').click();
  await page.locator('#empty-state-description').waitFor();
  check('320 플레이 빈 목록 설명이 기록 추가와 안 겹침', !(await overlapsFab('#empty-state-description')));
  check('320 플레이 빈 목록 버튼이 기록 추가와 안 겹침', !(await overlapsFab('#empty-state-action-btn')));
  await visible('플레이 검색 이름', page.getByRole('textbox', { name: '플레이 기록 검색' }));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#nav-tab-games').click();
  await page.locator('#empty-state-description').waitFor();
  check('390 게임 빈 목록 설명이 기록 추가와 안 겹침', !(await overlapsFab('#empty-state-description')));
  check('390 게임 빈 목록 버튼이 기록 추가와 안 겹침', !(await overlapsFab('#empty-state-action-btn')));
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

  await page.locator('#kakao-share-modal-overlay button[aria-label="닫기"]').click();
  await hidden('카카오 모달 닫힘', page.locator('#kakao-share-modal-overlay'));

  await page.locator('#game-card-game_heavy').click();
  const detail = page.locator('#game-detail-modal-overlay');
  await visible('이 게임 기록', detail.locator('#game-detail-play-list'));
  await hasText('연결된 기록의 장소', detail, '합성 장소');
  await hasText('기록 수', detail, '이 게임 기록 1회');
  const detailText = (await detail.textContent()) ?? '';
  check('다른 게임 장소는 상세에 없음', !detailText.includes('다른 장소'));

  await page.locator('#game-detail-modal-overlay').getByRole('button', { name: '닫기' }).click();
  await hidden('상세 닫힘', page.locator('#game-detail-modal-overlay'));
  await putRows(page, [
    {
      store: 'plays',
      row: {
        ...playRow('play_same_name', uid, '', '헤비합성', false),
        gameId: null,
        location: '이름만 같은 장소'
      }
    }
  ]);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#nav-tab-games').click();
  await page.locator('#game-card-game_heavy').click();
  const again = page.locator('#game-detail-modal-overlay');
  await hasText('이름만 같은 기록의 장소', again, '이름만 같은 장소');
  await hasText('연결 기록과 이름 기록을 함께 셈', again, '이 게임 기록 2회');
  const againText = (await again.textContent()) ?? '';
  check('다른 게임 장소는 여전히 없음', !againText.includes('다른 장소'));
});

test('home secondary text and win rate meet AA, and the game form close button is named', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });

  const label = await page
    .locator('#home-kpi-games span')
    .first()
    .evaluate((el) => getComputedStyle(el).color);
  check('보유 게임 라벨이 #636E72', label === 'rgb(99, 110, 114)', label);
  const win = await page.locator('#home-kpi-winrate').evaluate((el) => getComputedStyle(el).color);
  check('승률 숫자가 #1B7A43', win === 'rgb(27, 122, 67)', win);

  await page.locator('#nav-tab-games').click();
  const placeholder = await page
    .locator('#games-search-input')
    .evaluate((el) => getComputedStyle(el, '::placeholder').color);
  check('검색 플레이스홀더가 #636E72', placeholder === 'rgb(99, 110, 114)', placeholder);

  await page.locator('#games-add-game-btn').click();
  const closeName = await page.locator('#game-form-close-btn').evaluate((el) => el.getAttribute('aria-label'));
  check('게임 등록 닫기 이름이 닫기', closeName === '닫기', closeName ?? '');
  await visible('게임명 입력에 라벨이 연결됨', page.getByRole('textbox', { name: /게임명/ }));
});

test('game form labels reach their fields, and a reversed player count is refused', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#nav-tab-games').click();
  await page.locator('#games-add-game-btn').click();
  await page.locator('#game-input-title').waitFor();

  await visible('영문명 라벨', page.getByRole('textbox', { name: '영문명' }));
  await visible('보유 상태 라벨', page.getByRole('combobox', { name: /보유 상태/ }));
  await visible('최소 인원 라벨', page.getByRole('spinbutton', { name: '최소 인원' }));
  await visible('장르 묶음', page.getByRole('group', { name: /장르 선택/ }));
  const border = await page.locator('#game-input-title').evaluate((el) => getComputedStyle(el).borderTopColor);
  check('입력 테두리가 #898B8D', border === 'rgb(137, 139, 141)', border);

  await page.locator('#game-input-title').fill('테스트게임');
  await page.locator('#game-input-min-players').fill('8');
  await page.locator('#game-input-max-players').fill('2');
  await page.locator('#game-form-save-btn').click();
  await visible('인원 순서 오류', page.getByText('최소 인원이 최대 인원보다 큽니다.'));
  await visible('폼이 닫히지 않음', page.locator('#game-form-modal-overlay'));
});

test('play form fields are named and their borders clear the background', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#dashboard-add-play-cta').click();
  await page.locator('#play-input-location').waitFor();

  await visible('장소 라벨', page.getByRole('textbox', { name: '장소' }));
  await visible('날짜 라벨', page.getByRole('textbox', { name: '플레이 날짜' }));
  await visible('시작 시간 라벨', page.getByRole('textbox', { name: '시작' }));
  await visible('나의 결과 묶음', page.getByRole('group', { name: /나의 결과/ }));
  const border = await page.locator('#play-input-location').evaluate((el) => getComputedStyle(el).borderTopColor);
  check('장소 칸 테두리가 #898B8D', border === 'rgb(137, 139, 141)', border);
});

test('kakao and catalog filters are named', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#nav-tab-games').click();
  await page.locator('#games-kakao-share-btn').click();
  await page.getByRole('button', { name: /일부 선택 공유/ }).click();
  await visible('카카오 장르 선택', page.getByRole('combobox', { name: '장르 선택' }));
  await visible('카카오 난이도', page.getByRole('combobox', { name: '난이도 (웨이트)' }));
  await visible('카카오 게임 검색', page.getByRole('textbox', { name: '게임 직접 검색' }));
  await visible('카카오 상단 메시지', page.getByRole('textbox', { name: /카카오톡 공유 상단 메시지/ }));
  await page.locator('#kakao-share-modal-overlay button[aria-label="닫기"]').click();

  await page.locator('#games-print-catalog-btn').click();
  await visible('도록 검색', page.getByRole('textbox', { name: '도록 내 검색' }));
  await visible('도록 상태', page.getByRole('combobox', { name: '소장 상태' }));
});

test('game and play cards open from the keyboard without pressing delete', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const uid = await requireUid(page);
  await putRows(page, [
    { store: 'games', row: gameRow({ id: 'key_game', userId: uid, title: '키보드게임', playCount: 1 }) },
    { store: 'plays', row: playRow('key_play', uid, 'key_game', '키보드게임', true) }
  ]);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#nav-tab-games').click();

  const openGame = page.getByRole('button', { name: '키보드게임 열기' });
  await openGame.focus();
  await page.keyboard.press('Enter');
  await visible('키보드로 연 게임 상세', page.locator('#game-detail-modal-overlay'));
  await page.locator('#game-detail-modal-overlay').getByRole('button', { name: '닫기' }).click();

  await page.locator('#game-card-key_game').getByRole('button', { name: '게임 삭제' }).click();
  await visible('삭제는 상세를 열지 않음', page.getByRole('heading', { name: '보드게임 삭제' }));
  await hidden('삭제 중에는 상세가 없음', page.locator('#game-detail-modal-overlay'));
  await page.getByRole('button', { name: '취소' }).click();

  await page.locator('#nav-tab-plays').click();
  await page.locator('#play-card-key_play').focus();
  await page.keyboard.press('Space');
  await visible('키보드로 연 기록 상세', page.locator('#play-detail-modal-overlay'));
});
