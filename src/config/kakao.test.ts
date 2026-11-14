import { describe, expect, it } from 'vitest';
import { KAKAO_APP_KEY, kakaoSharerUrl } from './kakao';

describe('kakaoSharerUrl', () => {
  it('does not build a sharer link from the empty placeholder', () => {
    expect(KAKAO_APP_KEY).toBe('');
    expect(kakaoSharerUrl('https://board-log.vercel.app/')).toBeNull();
    expect(kakaoSharerUrl('https://board-log.vercel.app/', '   ')).toBeNull();
  });

  it('includes a real key only when one is passed', () => {
    const url = kakaoSharerUrl('https://board-log.vercel.app/shelf', 'real-key');
    expect(url).toContain('app_key=real-key');
    expect(url).not.toContain('boardgame');
  });
});
