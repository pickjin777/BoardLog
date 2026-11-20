import { describe, expect, it } from 'vitest';
import { buildPrivacySections } from './PrivacyNoticeModal';

const photoLine = () =>
  buildPrivacySections(false, 'browser').find((section) => section.heading === '사진으로 게임 등록')?.lines[0] ?? '';

describe('buildPrivacySections', () => {
  it('describes the consent gate and says photos are not stored', () => {
    const line = photoLine();
    expect(line).toContain('안내를 확인한 뒤');
    expect(line).toContain('Gemini');
    expect(line).toContain('사진을 저장하지 않습니다');
    expect(line).toContain('설정에서 끄면');
    expect(line).not.toContain('이 버전에서는 사진 인식을 사용하지 않습니다');
  });

  it('uses device wording away from the browser', () => {
    const line = buildPrivacySections(false, 'device')[0]?.lines[0] ?? '';
    expect(line).toContain('이 기기에만');
    expect(line).not.toContain('브라우저');
  });
});
