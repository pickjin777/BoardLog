import { describe, expect, it } from 'vitest';
import { copiedKeyOffer, geminiKeyIssueMessage, geminiVerifyHelp, tidyGeminiKey } from './geminiKeyText';

const WHOLE = `AIza${'x'.repeat(35)}`;

describe('tidyGeminiKey', () => {
  it('drops spaces, line breaks, and quotes', () => {
    expect(tidyGeminiKey(`  "${WHOLE}" \n`)).toEqual({ ok: true, key: WHOLE });
    expect(tidyGeminiKey(`\u00a0${WHOLE}\u00a0`)).toEqual({ ok: true, key: WHOLE });
  });

  it('explains an empty paste, a cut-off paste, and a paste that does not look like a key', () => {
    expect(tidyGeminiKey('  \n ')).toEqual({ ok: false, issue: 'empty' });
    expect(tidyGeminiKey("''")).toEqual({ ok: false, issue: 'empty' });
    expect(tidyGeminiKey('hello key')).toEqual({ ok: false, issue: 'shape' });
    expect(tidyGeminiKey('AIzaShort')).toEqual({ ok: false, issue: 'partial' });
    expect(tidyGeminiKey(`${WHOLE}!`)).toEqual({ ok: false, issue: 'shape' });
    expect(tidyGeminiKey(`AIza${'y'.repeat(210)}`)).toEqual({ ok: false, issue: 'shape' });
  });
});

describe('copiedKeyOffer', () => {
  it('offers a whole key only when it is not already in the field', () => {
    expect(copiedKeyOffer(` ${WHOLE}\n`, '')).toBe(WHOLE);
    expect(copiedKeyOffer(WHOLE, WHOLE)).toBeNull();
    expect(copiedKeyOffer('AIzaShort', '')).toBeNull();
    expect(copiedKeyOffer('   ', WHOLE)).toBeNull();
  });
});

describe('plain-language hints', () => {
  it('has a sentence for every paste problem and every connection problem', () => {
    for (const issue of ['empty', 'partial', 'shape'] as const) {
      expect(geminiKeyIssueMessage(issue).length).toBeGreaterThan(8);
    }
    expect(geminiKeyIssueMessage('partial')).toContain('잘린');
    expect(geminiVerifyHelp('invalid')).toContain('다시 복사');
    expect(geminiVerifyHelp('limited')).toContain('잠시');
    expect(geminiVerifyHelp('offline')).toContain('인터넷');
    expect(geminiVerifyHelp('failed')).toContain('잠시');
  });
});
