import { expect, test, type Page } from '@playwright/test';

const WIDTHS = [
  { name: '320', width: 320, height: 700 },
  { name: '360', width: 360, height: 800 },
  { name: '412', width: 412, height: 915 },
  { name: 'tablet-landscape', width: 1024, height: 768 }
];

async function skipChest(page: Page) {
  const reveal = page.locator('#treasure-reveal');
  if (await reveal.isVisible()) await page.locator('#treasure-skip-btn').click();
  await expect(reveal).toBeHidden();
}

async function overflowReport(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const pageOverflow = root.scrollWidth - root.clientWidth;
    const clipped = [...document.querySelectorAll('h1, h2, h3, p, button, a, label')].flatMap((element) => {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') return [];
      if (element.clientWidth < 1) return [];
      const cutsText =
        element.scrollWidth > element.clientWidth + 4 &&
        (style.overflowX === 'hidden' || style.overflowX === 'clip' || style.textOverflow === 'ellipsis');
      if (!cutsText) return [];
      const label = element.id || element.textContent?.replace(/\s+/g, ' ').trim().slice(0, 40) || element.tagName;
      return [`${label} ${element.clientWidth}/${element.scrollWidth}`];
    });
    const edges = [...document.querySelectorAll('body *')]
      .map((element) => {
        const box = element.getBoundingClientRect();
        return { right: box.right, id: element.id || element.className.toString().slice(0, 70) };
      })
      .sort((a, b) => b.right - a.right)
      .slice(0, 6)
      .map((item) => `${Math.round(item.right)} ${item.id}`);
    return { pageOverflow, inner: window.innerWidth, scroll: root.scrollWidth, clipped: clipped.slice(0, 8), edges };
  });
}

async function expectNoHorizontalScroll(page: Page, name: string) {
  const report = await overflowReport(page);
  expect(report.pageOverflow, `${name} scroll ${JSON.stringify(report)}`).toBeLessThanOrEqual(1);
  expect(report.clipped, name).toEqual([]);
}

test('narrow phones, a landscape tablet, and 200% text do not scroll sideways', async ({ page }) => {
  for (const viewport of WIDTHS) {
    await page.setViewportSize(viewport);
    await page.goto('/', { waitUntil: 'networkidle' });
    await skipChest(page);
    await expectNoHorizontalScroll(page, `home ${viewport.name}`);
    await page.addStyleTag({
      content: ':root { --safe-area-inset-top: 24px; --safe-area-inset-bottom: 20px; }'
    });
    const headerPad = await page.locator('#top-app-header').evaluate((el) => getComputedStyle(el).paddingTop);
    expect(headerPad, `header safe area ${viewport.name}`).toBe('24px');
    const mainPad = await page.locator('#app-shell-main').evaluate((el) => getComputedStyle(el).paddingBottom);
    if (viewport.width < 1024) {
      expect(Number.parseFloat(mainPad), `main safe area ${viewport.name}`).toBeGreaterThanOrEqual(20);
    }

    await page.locator('#nav-tab-games').click();
    await expectNoHorizontalScroll(page, `games ${viewport.name}`);
    await page.locator('#games-add-game-btn').click();
    await expectNoHorizontalScroll(page, `game form ${viewport.name}`);
    await page.locator('#game-form-close-btn').click();

    await page.locator('#nav-tab-plays').click();
    await expectNoHorizontalScroll(page, `plays ${viewport.name}`);
    if (viewport.name === '320') {
      await page.locator('#plays-tab-add-btn').click();
      await expectNoHorizontalScroll(page, 'play form 320');
      await page.locator('#play-record-modal-overlay button[aria-label="닫기"]').click();
    }
    await page.locator('#nav-tab-mypage').click();
    await expectNoHorizontalScroll(page, `my page ${viewport.name}`);
  }

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await skipChest(page);
  await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
  await expectNoHorizontalScroll(page, 'home 200%');
  await page.locator('#nav-tab-games').click();
  await expectNoHorizontalScroll(page, 'games 200%');
  await page.locator('#games-add-game-btn').click();
  await expectNoHorizontalScroll(page, 'game form 200%');
  await page.locator('#game-form-close-btn').click();
  await page.locator('#nav-fab-add-play').click();
  await expectNoHorizontalScroll(page, 'play form 200%');
});
