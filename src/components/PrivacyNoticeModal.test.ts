import { describe, expect, it } from 'vitest';
import { buildPrivacySections } from './PrivacyNoticeModal';

const photoSection = (scanAvailable: boolean) =>
  buildPrivacySections(false, scanAvailable).find((section) => section.heading === '사진으로 게임 등록');

describe('buildPrivacySections', () => {
  it('does not say photo scan is in use when the server has no key', () => {
    const line = photoSection(false)?.lines[0] ?? '';
    expect(line).toContain('사진 인식을 사용하지 않습니다');
    expect(line.startsWith("'사진으로 게임 등록'을 쓰면")).toBe(false);
  });

  it('describes the Gemini hand-off only when scan is actually available', () => {
    const line = photoSection(true)?.lines[0] ?? '';
    expect(line).toContain('Gemini');
    expect(line).toContain('사진을 저장하지 않습니다');
  });
});
