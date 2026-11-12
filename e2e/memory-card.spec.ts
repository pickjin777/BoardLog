import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { gameRow, playRow, putRows, requireUid } from './helpers';

async function skipChest(page: Page) {
  const reveal = page.locator('#treasure-reveal');
  if (await reveal.isVisible()) await page.locator('#treasure-skip-btn').click();
  await expect(reveal).toBeHidden();
}

async function photoData(page: Page): Promise<string> {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.fillStyle = '#3A2E16';
    ctx.fillRect(0, 0, 480, 320);
    const meeples: Array<[string, number, number]> = [
      ['#4834D4', 120, 150],
      ['#F3D48A', 220, 120],
      ['#C4453C', 310, 180],
      ['#9BE7B8', 180, 220]
    ];
    for (const [color, x, y] of meeples) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y - 28, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x, y + 10, 28, 36, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    return canvas.toDataURL('image/jpeg', 0.9);
  });
}

function play(id: string, uid: string, title: string, date: string, extra: Record<string, unknown>) {
  return {
    ...playRow(id, uid, 'game_mem', title, false),
    date,
    order: 3,
    gameImageUrl: '',
    photos: [],
    ...extra
  };
}

async function seedHistory(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const uid = await requireUid(page);
  const photo = await photoData(page);
  const gameArt = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.fillStyle = '#4834D4';
    ctx.fillRect(0, 0, 160, 160);
    ctx.fillStyle = '#F3D48A';
    ctx.beginPath();
    ctx.arc(80, 52, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(80, 108, 28, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    return canvas.toDataURL('image/jpeg', 0.9);
  });
  await putRows(page, [
    { store: 'games', row: gameRow({ id: 'game_mem', userId: uid, title: '카탄' }) },
    {
      store: 'plays',
      row: play('play_photo', uid, '카탄', '2026.11.12', {
        order: 4,
        startTime: '19:00',
        photos: [{ id: 'ph1', url: photo, caption: '', rotation: 0 }],
        participants: [
          { id: 'p_me', name: '나', score: 7, rank: null, isWinner: false },
          { id: 'p_ms', name: '민수', score: 10, rank: null, isWinner: true }
        ],
        winnerNames: ['민수'],
        myResult: '패배'
      })
    },
    {
      store: 'plays',
      row: play('play_game', uid, '스플렌더', '2026.11.12', {
        order: 3,
        startTime: '21:00',
        gameImageUrl: gameArt,
        participants: [
          { id: 'p_me', name: '나', score: null, rank: null, isWinner: false },
          { id: 'p_jy', name: '지영', score: null, rank: null, isWinner: true }
        ],
        winnerNames: ['지영'],
        myResult: '패배'
      })
    },
    {
      store: 'plays',
      row: play('play_plain', uid, '도미니언', '2026.11.02', {
        order: 2,
        participants: [{ id: 'p_me', name: '나', score: null, rank: null, isWinner: true }],
        winnerNames: ['나'],
        myResult: '승리'
      })
    },
    {
      store: 'plays',
      row: play('play_oct', uid, '윙스팬', '2026.10.03', {
        order: 1,
        participants: [{ id: 'p_me', name: '나', score: 20, rank: null, isWinner: true }],
        winnerNames: ['나'],
        myResult: '승리'
      })
    }
  ]);
  await page.reload({ waitUntil: 'networkidle' });
  await skipChest(page);
  await page.locator('#nav-tab-plays').click();
  await expect(page.locator('#play-calendar')).toBeVisible();
  return photo;
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

async function expectContrast(page: Page, name: string, include: string) {
  const results = await new AxeBuilder({ page }).include(include).withRules(['color-contrast']).analyze();
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
      const box = element.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) return [];
      // Seven day columns cannot be 48px wide on a 320px phone without overlapping or scrolling.
      // Those cells stay at least 40px wide and 48px tall, and they fill the row with no overlap.
      const minWidth = element.classList.contains('calendar-day') && window.innerWidth < 360 ? 40 : 48;
      if (box.width >= minWidth && box.height >= 48) return [];
      const label =
        element.getAttribute('aria-label') || element.textContent?.replace(/\s+/g, ' ').trim() || element.id;
      return [
        `${Math.round(box.width)}x${Math.round(box.height)} ${element.tagName}#${element.id} ${label?.slice(0, 48)}`
      ];
    })
  );
  expect(small, name).toEqual([]);
}

async function expectWeekFits(page: Page, width: number) {
  const saturday = page.locator('.play-calendar-grid > span').nth(6);
  const box = await saturday.boundingBox();
  expect(box, 'saturday column').not.toBeNull();
  if (!box) return;
  expect(box.x, 'saturday starts on screen').toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width, `saturday fits in ${width}`).toBeLessThanOrEqual(width + 1);
  const gridOverflow = await page.locator('.play-calendar-grid').evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(gridOverflow, `calendar grid scroll ${width}`).toBeLessThanOrEqual(1);
  const day = page.locator('.calendar-day').first();
  const dayBox = await day.boundingBox();
  expect(dayBox, 'day cell').not.toBeNull();
  if (!dayBox) return;
  expect(dayBox.height, 'day hit height').toBeGreaterThanOrEqual(48);
  expect(dayBox.width, 'day hit width').toBeGreaterThanOrEqual(width >= 360 ? 48 : 40);
}

async function expectNoPageScroll(page: Page, name: string) {
  const report = await page.evaluate(() => {
    const root = document.documentElement;
    const outside = [...document.querySelectorAll('body *')]
      .filter((element) => !element.closest('.play-calendar-scroll'))
      .map((element) => {
        const box = element.getBoundingClientRect();
        return { right: Math.round(box.right), id: element.id || element.className.toString().slice(0, 70) };
      })
      .filter((item) => item.right > window.innerWidth)
      .sort((a, b) => b.right - a.right)
      .slice(0, 8);
    return {
      overflow: root.scrollWidth - root.clientWidth,
      scrollWidth: root.scrollWidth,
      inner: window.innerWidth,
      outside
    };
  });
  expect(report.overflow, `${name} ${JSON.stringify(report)}`).toBeLessThanOrEqual(1);
}

test('memory cards and the month calendar stay on the device', async ({ page }, testInfo) => {
  const photo = await seedHistory(page);

  const photoCard = page.locator('#play-card-play_photo');
  await expect(photoCard).toContainText('추억 카드');
  await expect(photoCard).toContainText('2026.11.12');
  await expect(photoCard).toContainText('참여 나, 민수');
  await expect(photoCard).toContainText('승자 민수 10점');
  await expect(photoCard).toHaveAttribute('data-image-kind', 'photo');
  const cardSrc = await photoCard.locator('img').getAttribute('src');
  expect(cardSrc).toBe(photo);

  await expect(page.locator('#play-card-play_game')).toHaveAttribute('data-image-kind', 'game');
  await expect(page.locator('#play-card-play_plain [data-placeholder="true"]')).toBeVisible();

  const day = page.getByRole('button', { name: /11월 12일, 게임 2판/ });
  await expect(day).toBeVisible();
  const thumb = day.locator('img');
  await expect(thumb).toBeVisible();
  const thumbInfo = await thumb.evaluate((img: HTMLImageElement) => ({
    width: img.naturalWidth,
    height: img.naturalHeight,
    length: img.currentSrc.length
  }));
  expect(thumbInfo.width).toBeLessThanOrEqual(64);
  expect(thumbInfo.height).toBeLessThanOrEqual(64);
  expect(thumbInfo.length).toBeLessThan(photo.length);

  const plainDay = page.getByRole('button', { name: /11월 2일, 게임 1판/ });
  await expect(plainDay.locator('img')).toHaveCount(0);
  await expect(plainDay.locator('.calendar-day-mark')).toBeVisible();
  const emptyDay = page.getByRole('button', { name: /11월 1일, 기록 없음/ });
  await expect(emptyDay.locator('.calendar-day-mark')).toHaveCount(0);
  await expect(emptyDay.locator('img')).toHaveCount(0);
  await expect(page.locator('#play-calendar .calendar-day-mark')).toHaveCount(1);

  const fill = await day.evaluate((button) => {
    const image = button.querySelector('img');
    if (!image) return 0;
    const buttonBox = button.getBoundingClientRect();
    const imageBox = image.getBoundingClientRect();
    return imageBox.width / buttonBox.width;
  });
  expect(fill).toBeGreaterThan(0.85);
  const cardPad = await photoCard.evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingLeft));
  expect(cardPad).toBeGreaterThanOrEqual(16);
  await expectWeekFits(page, 390);

  await page.screenshot({ path: testInfo.outputPath('memory-and-calendar-390.png'), fullPage: true });
  await page.locator('#play-calendar').screenshot({ path: testInfo.outputPath('calendar-390.png') });
  await photoCard.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await photoCard.screenshot({ path: testInfo.outputPath('memory-card-390.png') });

  await day.click();
  await expect(page.getByText('11월 12일의 추억 카드')).toBeVisible();
  await expect(photoCard).toBeVisible();
  await expect(page.locator('#play-card-play_game')).toBeVisible();
  await expect(page.locator('#play-card-play_plain')).toHaveCount(0);
  await page.locator('#plays-show-all-btn').click();
  await expect(page.locator('#play-card-play_plain')).toBeVisible();

  await page.locator('#calendar-prev-month').click();
  await expect(page.getByRole('heading', { name: '2026년 10월' })).toBeVisible();
  await page.getByRole('button', { name: /10월 3일, 게임 1판/ }).click();
  await expect(page.locator('#play-card-play_oct')).toContainText('승자 나 20점');
  await expect(page.locator('#play-card-play_photo')).toHaveCount(0);

  await page.locator('#calendar-next-month').click();
  await expect(page.getByRole('heading', { name: '2026년 11월' })).toBeVisible();
  await expectAxe(page, 'plays with memory cards');
  await expectContrast(page, 'calendar contrast', '#play-calendar');
  await expectContrast(page, 'card contrast', '#play-card-play_oct');
  await expectTouchTargets(page, 'plays targets');

  await page.locator('#plays-show-all-btn').click();

  for (const width of [320, 360, 412]) {
    await page.setViewportSize({ width, height: 800 });
    await expectNoPageScroll(page, `plays ${width}`);
    await expectTouchTargets(page, `targets ${width}`);
    await expectWeekFits(page, width);
  }
  await page.setViewportSize({ width: 320, height: 700 });
  await page.locator('#play-calendar').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.locator('#play-calendar').screenshot({ path: testInfo.outputPath('calendar-320.png') });
  await photoCard.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await photoCard.screenshot({ path: testInfo.outputPath('memory-card-320.png') });

  await page.setViewportSize({ width: 1024, height: 768 });
  await expectNoPageScroll(page, 'tablet landscape');
  await expectTouchTargets(page, 'tablet targets');

  await page.setViewportSize({ width: 360, height: 800 });
  await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
  await expectNoPageScroll(page, '200% text');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  await skipChest(page);
  await page.locator('#nav-tab-plays').click();
  const motion = await page
    .locator('.memory-card')
    .first()
    .evaluate((el) => {
      const style = getComputedStyle(el);
      return { animation: style.animationName, transition: style.transitionDuration };
    });
  expect(motion.animation).toBe('none');
  expect(motion.transition).toBe('0s');
  await page.getByRole('button', { name: /11월 12일, 게임 2판/ }).click();
  await expect(page.locator('#play-card-play_photo')).toBeVisible();
});

test('saving a play shows the memory card and keeps it in history', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await skipChest(page);
  await page.locator('#dashboard-add-play-cta').click();
  const overlay = page.locator('#play-record-modal-overlay');
  await page.locator('#play-game-search-input').fill('카탄');
  await overlay.getByText('카탄', { exact: true }).first().click();
  await overlay.locator('input[placeholder="이름"]').nth(1).fill('민수');
  await overlay.locator('input[placeholder="점수"]').nth(1).fill('10');
  await overlay.locator('button[title="승자 토글"]').nth(1).click();
  await page.locator('#play-form-save-btn').click();

  const card = page.locator('#saved-memory-card');
  await expect(card).toBeVisible();
  await expect(card).toContainText('추억 카드');
  await expect(card).toContainText('카탄');
  await expect(card).toContainText('민수');
  await expect(card).toContainText('10점');
  await expectContrast(page, 'saved memory card', '#saved-memory-card');
  await page.getByRole('button', { name: '다음에 할게요' }).click();
  await expect(page.locator('#play-share-sheet')).toBeHidden();

  await page.locator('#nav-tab-plays').click();
  await expect(page.locator('#memory-card-list')).toContainText('카탄');
  await expect(page.locator('#memory-card-list')).toContainText('승자 민수 10점');
  await expectAxe(page, 'saved card in history');
});
