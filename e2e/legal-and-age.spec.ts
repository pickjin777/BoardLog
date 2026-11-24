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
  await expect(dialog).toContainText('어느 쪽도 미리 선택되어 있지 않아요');
  await expectAxe(page, 'age dialog');
  await page.screenshot({ path: testInfo.outputPath('age-band.png'), fullPage: false });
  await page.screenshot({ path: '/opt/cursor/artifacts/age-band.png' });

  await page.locator('#age-band-under-14').click();
  await expect(page.locator('#age-guardian-notice')).toBeVisible();
  await expect(page.locator('#age-guardian-notice')).toContainText('사진과 이름은 다른 곳으로 보내지 않아요');
  await expect(page.locator('#age-guardian-ack')).toHaveText('보호자와 안내를 읽었어요');
  await expectAxe(page, 'guardian notice');
  await page.screenshot({ path: testInfo.outputPath('age-guardian.png'), fullPage: false });
  await page.screenshot({ path: '/opt/cursor/artifacts/age-guardian.png' });

  await page.locator('#age-guardian-ack').click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('#settings-age-status')).toContainText('만 14세 미만');

  await page.locator('#settings-age-open').click();
  await page.locator('#age-band-14-or-over').click();
  await expect(page.locator('#age-upgrade-confirm')).toBeVisible();
  await page.screenshot({ path: '/opt/cursor/artifacts/age-upgrade.png' });
  await page.locator('#age-upgrade-stay').click();
  await expect(page.locator('#settings-age-status')).toContainText('만 14세 미만');
  await expect(page.locator('#settings-photo-under14')).toHaveText('꺼짐');
  await expect(page.locator('#settings-photo-recognition-toggle')).toHaveCount(0);

  await page.locator('#nav-tab-games').click();
  await page.locator('#games-add-game-btn').click();
  await expect(page.locator('#game-form-scan-unavailable')).toBeVisible();
  await expect(page.locator('#game-form-open-scan-btn')).toHaveCount(0);
});

test('public privacy and terms pages state the reviewed wording', async ({ page }) => {
  await page.goto('/privacy.html', { waitUntil: 'networkidle' });
  const privacy = page.locator('main');
  await expect(privacy).toContainText(
    '이 정보는 이용자의 기기에만 저장되며, 개발자는 이를 전송받거나 열람할 수 없습니다.'
  );
  await expect(privacy).toContainText('2026-11-24');
  await expect(privacy).toContainText('진상두');
  await expect(privacy).toContainText('pickjin777@gmail.com');
  await expect(privacy).toContainText('접속 기록의 IP 주소');
  await expect(privacy).toContainText('_ga');
  await expect(privacy).toContainText('제30조 제1항 제7호');
  await expect(privacy).not.toContainText('법률 검토');
  await expect(privacy).not.toContainText('미확인');
  await expect(privacy).not.toContainText('TBD');
  await expectAxe(page, 'privacy page');

  await page.goto('/terms.html', { waitUntil: 'networkidle' });
  const terms = page.locator('main');
  await expect(terms).toContainText('개발자의 고의 또는 과실로 인한 손해는 관련 법령에 따라 책임집니다.');
  await expect(terms).toContainText('다만 이용자가 백업하지 않아 생긴 기록 손실은 책임지지 않습니다.');
  await expect(terms).toContainText('앱의 오류로 기록이 지워진 경우는 위 단서에 들어가지 않습니다.');
  await expect(terms).toContainText('30일 전');
  await expect(terms).toContainText('7일 전');
  await expect(terms).toContainText('민사소송법이 정한 관할 법원');
  await expect(terms).toContainText('업무나 사업 목적');
  await expect(terms).not.toContainText('동의한 것으로 본다');
  await expect(terms).not.toContainText('법률 검토');
  await expect(terms).not.toContainText('수원지방법원');
  await expectAxe(page, 'terms page');
});

test('photo consent asks for a photo the person may use', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await skipChest(page);
  await page.locator('#nav-tab-mypage').click();
  await page.locator('#settings-age-open').click();
  await page.locator('#age-band-14-or-over').click();
  await page.locator('#nav-tab-games').click();
  await page.locator('#games-add-game-btn').click();
  await page.locator('#game-form-open-scan-btn').click();
  const rule = page.locator('#scan-consent-photo-rule');
  await expect(rule).toContainText('본인이 찍었거나 쓸 권한이 있는 상자 사진만 올려 주세요.');
  await expect(rule).toContainText('사람 얼굴, 이름, 주소 같은 개인정보가 나오지 않게 해 주세요.');
  await expectAxe(page, 'photo consent');
  await page.screenshot({ path: '/opt/cursor/artifacts/photo-consent.png' });
});
