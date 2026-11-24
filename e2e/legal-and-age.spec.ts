import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function skipChest(page: Page) {
  const reveal = page.locator('#treasure-reveal');
  if (await reveal.isVisible()) await page.locator('#treasure-skip-btn').click();
  await expect(reveal).toBeHidden();
}

async function expectAxe(page: Page, name: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const summary = results.violations
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`)
    .join('\n');
  expect(results.violations, `${name}\n${summary}`).toEqual([]);
}

test('settings link the public policy and terms, and under 14 keeps photos on the device', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await skipChest(page);
  await page.locator('#nav-tab-mypage').click();

  await expect(page.locator('#settings-contact')).toHaveAttribute('href', 'mailto:pickjin777@gmail.com');
  await expect(page.locator('#settings-contact-card')).toContainText('진상두');
  await expect(page.locator('#settings-contact-card')).toContainText('경기도 군포시 번영로 314');
  await expect(page.locator('#mypage-privacy-policy-link')).toHaveAttribute('href', '/privacy.html');
  await expect(page.locator('#mypage-terms-link')).toHaveAttribute('href', '/terms.html');

  await page.locator('#settings-age-open').click();
  const dialog = page.locator('#age-band-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('만 14세 미만도 이 기기에 기록을 남길 수 있습니다');
  await expectAxe(page, 'age dialog');
  await page.screenshot({ path: testInfo.outputPath('age-band.png'), fullPage: false });
  await page.screenshot({ path: '/opt/cursor/artifacts/age-band.png' });

  await page.locator('#age-band-under-14').click();
  await expect(page.locator('#age-guardian-notice')).toBeVisible();
  await expect(page.locator('#age-guardian-notice')).toContainText('개인정보를 수집하는 동의가 아닙니다');
  await expectAxe(page, 'guardian notice');
  await page.screenshot({ path: testInfo.outputPath('age-guardian.png'), fullPage: false });
  await page.screenshot({ path: '/opt/cursor/artifacts/age-guardian.png' });

  await page.locator('#age-guardian-ack').click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('#settings-age-status')).toContainText('만 14세 미만');
  await expect(page.locator('#settings-photo-under14')).toHaveText('꺼짐');
  await expect(page.locator('#settings-photo-recognition-toggle')).toHaveCount(0);

  await page.locator('#nav-tab-games').click();
  await page.locator('#games-add-game-btn').click();
  await expect(page.locator('#game-form-scan-unavailable')).toBeVisible();
  await expect(page.locator('#game-form-open-scan-btn')).toHaveCount(0);
});

test('public privacy and terms pages name the operator and stay drafts', async ({ page }) => {
  await page.goto('/privacy.html', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('개인정보 처리방침');
  const privacy = page.locator('main');
  await expect(privacy).toContainText('초안입니다');
  await expect(privacy).toContainText('2026-11-24');
  await expect(privacy).toContainText('진상두');
  await expect(privacy).toContainText('pickjin777@gmail.com');
  await expect(privacy).toContainText('경기도 군포시 번영로 314 4층 공유오피스1호');
  await expect(privacy).toContainText('만 14세 미만');
  await expect(privacy).toContainText('제22조의2');
  await expectAxe(page, 'privacy page');

  await page.goto('/terms.html', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('이용약관');
  const terms = page.locator('main');
  await expect(terms).toContainText('초안입니다');
  await expect(terms).toContainText('대한민국 법률');
  await expect(terms).toContainText('백업은 이용자의 책임');
  await expect(terms).toContainText('민사소송법');
  await expectAxe(page, 'terms page');
});
