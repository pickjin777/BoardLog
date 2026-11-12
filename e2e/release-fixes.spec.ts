import { expect, test } from '@playwright/test';
import { check, gameRow, hasText, hidden, playRow, putRows, requireUid, visible } from './helpers';

test('records-stay-on-device notice leads to JSON backup', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });

  await visible('기기 저장 안내', page.locator('#local-storage-notice'));
  await hasText('안내가 유실을 말함', page.locator('#local-storage-notice'), '이 기기의 브라우저에만');
  await hasText('헤더는 클라우드 로그인이 아님', page.locator('#header-user-profile-btn'), '이 기기');

  await page.locator('#local-storage-backup-btn').click();
  await visible('JSON 백업 버튼으로 이동', page.locator('#export-json-btn'));

  const covered = await page.evaluate(() => {
    const notice = document.querySelector('#local-storage-notice')?.getBoundingClientRect();
    const nav = document.querySelector('#bottom-navigation-bar')?.getBoundingClientRect();
    if (!notice || !nav) return true;
    const overlap = Math.min(notice.bottom, nav.bottom) - Math.max(notice.top, nav.top);
    return overlap > 1 || notice.bottom > nav.top + 1;
  });
  check('390 기기 저장 안내가 하단 탭에 가리지 않음', !covered);
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
    return tab !== null && getComputedStyle(tab).color === 'rgb(228, 211, 180)';
  });
  const navColor = await page.locator('#nav-tab-home').evaluate((el) => getComputedStyle(el).color);
  check('선택 안 된 탭 글자색이 #E4D3B4', navColor === 'rgb(228, 211, 180)', navColor);

  await page.locator('#nav-tab-plays').evaluate((el) => {
    if (!(el instanceof HTMLElement)) return;
    el.focus({ focusVisible: true } as FocusOptions);
  });
  await page.waitForFunction(() => {
    const tab = document.querySelector('#nav-tab-plays');
    return tab !== null && getComputedStyle(tab).outlineColor === 'rgb(228, 220, 255)';
  });
  const outline = await page.locator('#nav-tab-plays').evaluate((el) => getComputedStyle(el).outlineColor);
  check('탭 포커스 테두리가 보임', outline === 'rgb(228, 220, 255)', outline);

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
  const titleLines = await page.locator('#games-tab-title').evaluate((el) => el.getClientRects().length);
  const titleText = ((await page.locator('#games-tab-title').innerText()) ?? '').replace(/\s+/g, '');
  check(
    '320px에서 제목이 버튼 위에 넓게 있음',
    !!title && !!add && title.width > 200 && add.y >= title.y + title.height - 1,
    JSON.stringify({ title, add })
  );
  check('320px에서 제목이 한 줄이고 글자가 안 깨짐', titleLines === 1 && titleText === '내보드게임컬렉션', titleText);

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
  await hasText('시드 검색은 그대로', page.locator('#game-form-modal-overlay'), '빠른 검색');
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

test('without a scan key, a chosen photo falls back to manual entry and saves', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  let scanPosts = 0;
  await page.route('**/api/scan-games', (route) => {
    if (route.request().method() === 'POST') scanPosts += 1;
    return route.continue();
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#treasure-skip-btn').click();
  await page.locator('#nav-tab-games').click();
  await page.locator('#games-add-game-btn').click();
  await visible('키 없으면 준비 중 안내', page.locator('#game-form-scan-unavailable'));
  await page.locator('#game-form-pick-photo-btn').click();
  await visible('사진 선택 시트', page.locator('#scan-modal-sheet'));

  await page.locator('#scan-file-input').setInputFiles({
    name: 'shelf.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    )
  });
  await visible('직접 입력 안내', page.locator('#scan-manual-fallback'));
  await hasText('사진을 보내지 않음', page.locator('#scan-manual-fallback'), '서버로 보내지 않았습니다');
  check('인식 요청 없음', scanPosts === 0, String(scanPosts));

  await page.locator('#scan-manual-entry-btn').click();
  await visible('직접 입력 폼', page.locator('#game-input-title'));
  await hidden('사진 시트 닫힘', page.locator('#scan-modal-sheet'));
  await page.locator('#game-input-title').fill('키없이등록');
  await page.locator('#game-form-save-btn').click();
  await page.locator('#treasure-skip-btn').click();
  await visible('저장된 게임', page.getByRole('heading', { name: '키없이등록' }));
  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
});

test('without a scan key, several photos stay on the device and open manual entry', async ({ page }) => {
  let scanPosts = 0;
  await page.route('**/api/scan-games', (route) => {
    if (route.request().method() === 'POST') scanPosts += 1;
    return route.continue();
  });

  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#treasure-skip-btn').click();
  await page.locator('#nav-tab-games').click();
  await page.locator('#games-add-game-btn').click();
  await page.locator('#game-form-pick-photo-btn').click();
  await visible('사진 선택 시트', page.locator('#scan-modal-sheet'));

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  const longName = `${'shelf'.repeat(24)}.png`;
  await page.locator('#scan-file-input').setInputFiles([
    { name: 'shelf-a.png', mimeType: 'image/png', buffer: png },
    { name: longName, mimeType: 'image/png', buffer: png }
  ]);

  await visible('직접 입력 안내', page.locator('#scan-manual-fallback'));
  await hasText('첫 사진 이름', page.locator('#scan-manual-fallback'), 'shelf-a.png');
  await hasText('둘째 사진 이름', page.locator('#scan-manual-fallback'), longName);
  await hasText('사진을 보내지 않음', page.locator('#scan-manual-fallback'), '서버로 보내지 않았습니다');
  check('여러 장도 인식 요청 없음', scanPosts === 0, String(scanPosts));
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  check('긴 파일 이름이 화면 밖으로 안 나감', overflow <= 1, String(overflow));

  await page.locator('#scan-manual-entry-btn').click();
  await visible('직접 입력 폼', page.locator('#game-input-title'));
  await hidden('사진 시트 닫힘', page.locator('#scan-modal-sheet'));
});

test('ownership filters keep the whole label at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#nav-tab-games').click();
  const clipped = await page.locator('#games-ownership-filters button').evaluateAll((buttons) =>
    buttons.flatMap((button) =>
      button.scrollWidth > button.clientWidth + 1 ? [button.textContent?.trim() ?? button.id] : []
    )
  );
  check('소장 상태 글자가 버튼 안에 있음', clipped.length === 0, clipped.join(','));
  await page.locator('#games-ownership-filters').evaluate((row) => {
    row.scrollLeft = row.scrollWidth;
  });
  const sold = page.getByRole('button', { name: '판매완료', exact: true });
  await visible('판매완료까지 스크롤됨', sold);
  const inView = await sold.evaluate((button) => {
    const box = button.getBoundingClientRect();
    return box.left >= -1 && box.right <= window.innerWidth + 1 && button.scrollWidth <= button.clientWidth + 1;
  });
  check('판매완료 글자가 화면에 다 보임', inView);
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
  await page.locator('#kakao-filter-weight').selectOption('heavy');
  await page.locator('#kakao-filter-search').fill('없는이름');
  await page.getByRole('button', { name: '2인 추천/전용' }).click();
  await visible('난이도와 검색이 둘 다 맞을 때만 고름', page.getByText('0/2개 선택됨'));
  await page.locator('#kakao-filter-search').fill('헤비');
  await page.getByRole('button', { name: '2인 추천/전용' }).click();
  await visible('헤비이면서 검색에 맞는 게임만', page.getByText('1/2개 선택됨'));
  const picked = (await page.locator('#kakao-share-modal-overlay').innerText()) ?? '';
  check('라이트 게임은 빠른 추천에 없음', !picked.includes('라이트합성'));

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
  check('보유 게임 라벨이 #E4D3B4', label === 'rgb(228, 211, 180)', label);
  const win = await page.locator('#home-kpi-winrate').evaluate((el) => getComputedStyle(el).color);
  check('승률 숫자가 #9BE7B8', win === 'rgb(155, 231, 184)', win);

  await page.locator('#nav-tab-games').click();
  const placeholder = await page
    .locator('#games-search-input')
    .evaluate((el) => getComputedStyle(el, '::placeholder').color);
  check('검색 플레이스홀더가 #E4D3B4', placeholder === 'rgb(228, 211, 180)', placeholder);

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
  check('입력 테두리가 #C6A36A', border === 'rgb(198, 163, 106)', border);

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
  check('장소 칸 테두리가 #C6A36A', border === 'rgb(198, 163, 106)', border);
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

test('play photos open from the keyboard and the header clears the actions', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const uid = await requireUid(page);
  const photo =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#4834D4"/></svg>'
    );
  await putRows(page, [
    {
      store: 'plays',
      row: {
        ...playRow('photo_play', uid, 'missing_game', '사진게임', true),
        durationMinutes: 130,
        location: '홍대',
        photos: [
          { id: 'ph1', url: photo, caption: '테이블 세팅', rotation: 0 },
          { id: 'ph2', url: 'https://invalid.example/missing-photo.png', caption: '', rotation: 0 }
        ]
      }
    }
  ]);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#nav-tab-plays').click();
  await page.locator('#play-card-photo_play').click();
  await visible('기록 상세', page.locator('#play-detail-modal-overlay'));
  await visible('만족도', page.getByRole('img', { name: '만족도 5점' }));

  const headerOverlaps = await page.evaluate(() => {
    const modal = document.querySelector('#play-detail-modal-overlay');
    const edit = modal?.querySelector('button[aria-label="기록 수정"]');
    const dateLine = modal?.querySelector('#play-detail-when');
    if (!edit || !dateLine) return true;
    const a = dateLine.getBoundingClientRect();
    const b = edit.getBoundingClientRect();
    const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return x > 1 && y > 1;
  });
  check('320 날짜가 수정 버튼과 안 겹침', !headerOverlaps);

  const openPhoto = page.getByRole('button', { name: '현장 사진 1, 테이블 세팅 확대' });
  await openPhoto.evaluate((el) => {
    if (el instanceof HTMLElement) el.focus({ focusVisible: true } as FocusOptions);
  });
  const outline = await openPhoto.evaluate((el) => getComputedStyle(el).outlineColor);
  check('사진 포커스 테두리', outline === 'rgb(228, 220, 255)', outline);

  await page.keyboard.press('Enter');
  await visible('엔터로 연 확대', page.locator('#photo-lightbox-modal'));
  await visible('확대 닫기 이름', page.getByRole('button', { name: '확대 사진 닫기', exact: true }));
  const focusedOnOpen = await page.evaluate(() => document.activeElement?.id);
  check('열리면 닫기 버튼에 포커스', focusedOnOpen === 'photo-lightbox-close-btn');

  await page.keyboard.press('Escape');
  await hidden('이스케이프로 닫힘', page.locator('#photo-lightbox-modal'));
  const returned = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  check('포커스가 사진으로 돌아옴', returned === '현장 사진 1, 테이블 세팅 확대');

  await page.keyboard.press('Space');
  await visible('스페이스로 다시 열림', page.locator('#photo-lightbox-modal'));
  await page.locator('#photo-lightbox-modal').click({ position: { x: 8, y: 8 } });
  await hidden('바깥을 누르면 닫힘', page.locator('#photo-lightbox-modal'));

  await openPhoto.click();
  await visible('클릭으로도 열림', page.locator('#photo-lightbox-modal'));
  await page.locator('#photo-lightbox-close-btn').click();
  await hidden('닫기 버튼으로 닫힘', page.locator('#photo-lightbox-modal'));

  await page.waitForFunction(() => {
    const img = document.querySelector('button[aria-label="현장 사진 2 확대"] img');
    return img instanceof HTMLImageElement && img.src.startsWith('data:image/svg+xml');
  });
  const fallback = await page
    .getByRole('button', { name: '현장 사진 2 확대' })
    .locator('img')
    .evaluate((img) => img.getAttribute('src')?.startsWith('data:image/svg+xml') ?? false);
  check('깨진 사진은 대체 그림', fallback);

  await page.setViewportSize({ width: 390, height: 844 });
  const overlap390 = await page.evaluate(() => {
    const modal = document.querySelector('#play-detail-modal-overlay');
    const edit = modal?.querySelector('button[aria-label="기록 수정"]');
    const dateLine = modal?.querySelector('#play-detail-when');
    if (!edit || !dateLine) return true;
    const a = dateLine.getBoundingClientRect();
    const b = edit.getBoundingClientRect();
    const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return x > 1 && y > 1;
  });
  check('390 날짜가 수정 버튼과 안 겹침', !overlap390);
});

test('broken catalog, seed, and play-form photos use the same fallback', async ({ page }) => {
  await page.route('**://images.unsplash.com/**', (route) => route.abort());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const uid = await requireUid(page);
  const broken = 'https://invalid.example/missing-cover.png';
  await putRows(page, [
    {
      store: 'games',
      row: gameRow({ id: 'cover_game', userId: uid, title: '깨진표지', imageUrl: broken, playCount: 1 })
    },
    {
      store: 'plays',
      row: {
        ...playRow('photo_play', uid, 'cover_game', '깨진표지', true),
        photos: [{ id: 'ph_bad', url: broken, caption: '현장', rotation: 0 }]
      }
    }
  ]);
  await page.reload({ waitUntil: 'networkidle' });

  const usesFallback = async (name: string, selector: string) => {
    await page.waitForFunction((sel) => {
      const img = document.querySelector(sel);
      return img instanceof HTMLImageElement && img.src.startsWith('data:image/svg+xml');
    }, selector);
    const ok = await page
      .locator(selector)
      .first()
      .evaluate((img) => img.getAttribute('src')?.startsWith('data:image/svg+xml') ?? false);
    check(name, ok);
  };

  await page.locator('#nav-tab-games').click();
  await page.locator('#games-print-catalog-btn').click();
  await usesFallback('도록 표 표지', '#printable-catalog-document img');
  await page.getByRole('button', { name: '수록 카드형' }).click();
  await usesFallback('도록 카드 표지', '#printable-catalog-document img');
  await page.locator('#game-catalog-modal-overlay button[aria-label="닫기"]').click();

  await page.locator('#games-add-game-btn').click();
  await page.locator('#seed-game-search-input').fill('카탄');
  await usesFallback('시드 검색 표지', '#game-form-modal-overlay img[alt="카탄"]');
  await page.locator('#game-form-close-btn').click();

  await page.locator('#nav-tab-plays').click();
  await page.locator('#play-card-photo_play').click();
  await page.locator('#play-detail-modal-overlay').getByRole('button', { name: '기록 수정' }).click();
  await usesFallback('기록 폼 사진', '#play-record-modal-overlay img[alt="플레이 사진"]');
});

test('tablet widens the page and desktop puts navigation on the side', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const uid = await requireUid(page);
  await putRows(
    page,
    ['카탄', '스플렌더', '윙스팬', '아크노바'].map((title, index) => ({
      store: 'games' as const,
      row: gameRow({ id: `wide_${index}`, userId: uid, title, playCount: index + 1 })
    }))
  );
  await page.reload({ waitUntil: 'networkidle' });

  const phoneNav = await page.locator('#bottom-navigation-bar').boundingBox();
  const phoneMain = await page.locator('main').boundingBox();
  check('폰에서는 메뉴가 아래', !!phoneNav && phoneNav.y > 700, JSON.stringify(phoneNav));
  check('폰 본문은 화면 너비', !!phoneMain && phoneMain.width <= 420, JSON.stringify(phoneMain));

  await page.setViewportSize({ width: 768, height: 1024 });
  const tabletMain = await page.locator('main').boundingBox();
  const tabletNav = await page.locator('#bottom-navigation-bar').boundingBox();
  check('태블릿 본문이 더 넓음', !!tabletMain && tabletMain.width >= 700, JSON.stringify(tabletMain));
  check('태블릿 메뉴는 아래', !!tabletNav && tabletNav.y > 900, JSON.stringify(tabletNav));

  await page.setViewportSize({ width: 1280, height: 800 });
  const deskNav = await page.locator('#bottom-navigation-bar').boundingBox();
  const deskMain = await page.locator('main').boundingBox();
  check(
    'PC 메뉴는 왼쪽 세로',
    !!deskNav && deskNav.x < 8 && deskNav.width >= 200 && deskNav.width <= 280 && deskNav.height > 600,
    JSON.stringify(deskNav)
  );
  check(
    'PC 본문은 메뉴 오른쪽',
    !!deskMain && !!deskNav && deskMain.x >= deskNav.width - 1,
    JSON.stringify({ deskMain, deskNav })
  );

  await page.locator('#nav-tab-games').click();
  await page.locator('#game-card-wide_3').waitFor();
  const rows = await page.evaluate(() => {
    const tops = ['wide_0', 'wide_1', 'wide_2', 'wide_3'].map((id) => {
      const box = document.querySelector(`#game-card-${id}`)?.getBoundingClientRect();
      return box ? Math.round(box.top) : -1;
    });
    return new Set(tops).size;
  });
  check('PC 게임은 한 줄에 네 장', rows === 1, String(rows));
});

test('pdf and kakao image load their libraries only when saving', async ({ page }) => {
  const heavy: string[] = [];
  page.on('request', (request) => {
    if (/jspdf|html2canvas/.test(request.url())) heavy.push(request.url());
  });
  page.on('dialog', (dialog) => {
    void dialog.dismiss();
  });
  await page.setViewportSize({ width: 420, height: 900 });
  await page.goto('/', { waitUntil: 'networkidle' });
  check('첫 화면은 PDF·캡처 라이브러리를 받지 않음', heavy.length === 0, heavy.join(' '));

  const uid = await requireUid(page);
  await putRows(page, [
    { store: 'games', row: gameRow({ id: 'export_game', userId: uid, title: '내보내기용', imageUrl: '' }) }
  ]);
  await page.reload({ waitUntil: 'networkidle' });
  check('새로고침 후에도 PDF·캡처 라이브러리를 받지 않음', heavy.length === 0, heavy.join(' '));

  await page.locator('#nav-tab-games').click();
  await page.locator('#games-print-catalog-btn').click();
  await page.locator('#printable-catalog-document').waitFor();
  await page.evaluate(() => {
    window.print = () => undefined;
  });
  const pdfDone = page.getByText(/PDF 저장이 완료되었습니다|인쇄 창으로 전환합니다/);
  await page.locator('#catalog-print-btn').click();
  await pdfDone.waitFor();
  check(
    'PDF를 누른 뒤에 라이브러리를 받음',
    heavy.some((url) => url.includes('jspdf')) && heavy.some((url) => url.includes('html2canvas')),
    heavy.join(' ')
  );

  await page.locator('#game-catalog-modal-overlay button[aria-label="닫기"]').click();
  await page.locator('#games-kakao-share-btn').click();
  await page.locator('#kakao-share-modal-overlay').waitFor();
  await page.getByRole('button', { name: '전체 선택' }).click();
  await page.getByRole('button', { name: '2. 카카오톡 미리보기' }).click();
  const imageDone = page.getByText(/이미지 카드가 저장되었습니다|이미지 카드 생성에 실패했습니다/);
  await page.locator('button[title="이미지 카드로 저장"]').click();
  await imageDone.waitFor();
});
