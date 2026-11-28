import { describe, expect, it } from 'vitest';
import { copiedKeyOffer, geminiKeyIssueMessage, geminiVerifyHelp, tidyGeminiKey } from './geminiKeyText';

const AIZA = `AIza${'x'.repeat(35)}`;
const DOTTED = `AQ.${'ab'.repeat(8)}.key-1`;

describe('tidyGeminiKey', () => {
  it('accepts an AIza key and an AQ key that contains dots', () => {
    expect(tidyGeminiKey(AIZA)).toEqual({ ok: true, key: AIZA });
    expect(tidyGeminiKey(DOTTED)).toEqual({ ok: true, key: DOTTED });
    expect(DOTTED.includes('.')).toBe(true);
  });

  it('drops spaces, quotes, backticks, a label, NBSP, and zero-width characters', () => {
    expect(tidyGeminiKey(`  "${AIZA}" \n`)).toEqual({ ok: true, key: AIZA });
    expect(tidyGeminiKey(`\u00a0${DOTTED}\u00a0`)).toEqual({ ok: true, key: DOTTED });
    expect(tidyGeminiKey(`\`${DOTTED}\``)).toEqual({ ok: true, key: DOTTED });
    expect(tidyGeminiKey(`API key: ${DOTTED}`)).toEqual({ ok: true, key: DOTTED });
    expect(tidyGeminiKey(`API 키： "${DOTTED}"`)).toEqual({ ok: true, key: DOTTED });
    expect(tidyGeminiKey(`AQ.\u200b${'ab'.repeat(8)}.key-1`)).toEqual({ ok: true, key: DOTTED });
    expect(tidyGeminiKey(`AQ.${'ab'.repeat(4)}\n${'ab'.repeat(4)}.key-1`)).toEqual({ ok: true, key: DOTTED });
  });

  it('rejects an empty paste, a cut-off paste, Korean, a URL, and an over-long paste', () => {
    expect(tidyGeminiKey('  \n ')).toEqual({ ok: false, issue: 'empty' });
    expect(tidyGeminiKey("''")).toEqual({ ok: false, issue: 'empty' });
    expect(tidyGeminiKey('API key:')).toEqual({ ok: false, issue: 'empty' });
    expect(tidyGeminiKey('AQ.short')).toEqual({ ok: false, issue: 'partial' });
    expect(tidyGeminiKey('hello key')).toEqual({ ok: false, issue: 'partial' });
    expect(tidyGeminiKey('연결비밀번호입니다')).toEqual({ ok: false, issue: 'shape' });
    expect(tidyGeminiKey('https://aistudio.google.com/apikey')).toEqual({ ok: false, issue: 'shape' });
    expect(tidyGeminiKey(`${AIZA}!`)).toEqual({ ok: false, issue: 'shape' });
    expect(tidyGeminiKey(`AQ.${'y'.repeat(320)}`)).toEqual({ ok: false, issue: 'shape' });
  });
});

describe('copiedKeyOffer', () => {
  it('offers a tidied key, including one with dots, only when it is not already in the field', () => {
    expect(copiedKeyOffer(` ${DOTTED}\n`, '')).toBe(DOTTED);
    expect(copiedKeyOffer(AIZA, '')).toBe(AIZA);
    expect(copiedKeyOffer(DOTTED, DOTTED)).toBeNull();
    expect(copiedKeyOffer('AQ.short', '')).toBeNull();
    expect(copiedKeyOffer('연결비밀번호', '')).toBeNull();
    expect(copiedKeyOffer('   ', DOTTED)).toBeNull();
  });
});

describe('plain-language hints', () => {
  it('has a sentence for every paste problem and every connection problem', () => {
    for (const issue of ['empty', 'partial', 'shape'] as const) {
      expect(geminiKeyIssueMessage(issue).length).toBeGreaterThan(8);
      expect(geminiKeyIssueMessage(issue)).not.toContain('AIza');
    }
    expect(geminiKeyIssueMessage('partial')).toContain('잘린');
    expect(geminiKeyIssueMessage('shape')).toContain('복사 버튼');
    expect(geminiVerifyHelp('invalid')).toContain('다시 복사');
    expect(geminiVerifyHelp('limited')).toContain('잠시');
    expect(geminiVerifyHelp('offline')).toContain('인터넷');
    expect(geminiVerifyHelp('failed')).toContain('잠시');
  });
});
