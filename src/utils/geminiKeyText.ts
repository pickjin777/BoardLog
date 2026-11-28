import type { GeminiKeyFailure } from './geminiDirect';

/** Shortest paste we still send to Google. Anything shorter is treated as cut off. */
const MIN_KEY_LENGTH = 20;
/** Long enough for a real key, short enough to refuse a pasted paragraph. */
const MAX_KEY_LENGTH = 300;

export type GeminiKeyIssue = 'empty' | 'partial' | 'shape';

export type TidiedGeminiKey = { ok: true; key: string } | { ok: false; issue: GeminiKeyIssue };

/**
 * Turns a paste into one token. Google decides whether that token is a real key.
 * The old `AIza` prefix is not required: AI Studio also issues keys such as `AQ.…`.
 */
export function tidyGeminiKey(raw: string): TidiedGeminiKey {
  const cleaned = raw
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\u00a0/g, ' ')
    .trim()
    .replace(/^['"`]+/, '')
    .replace(/['"`]+$/, '')
    .trim()
    .replace(/^(?:api[\s_-]*key|api[\s_-]*키)\s*[:：]\s*/i, '')
    .trim()
    .replace(/^['"`]+/, '')
    .replace(/['"`]+$/, '')
    .trim();
  const key = cleaned.replace(/\s+/g, '');
  if (key.length === 0) return { ok: false, issue: 'empty' };
  if (!/^[0-9A-Za-z._-]+$/.test(key)) return { ok: false, issue: 'shape' };
  if (key.length < MIN_KEY_LENGTH) return { ok: false, issue: 'partial' };
  if (key.length > MAX_KEY_LENGTH) return { ok: false, issue: 'shape' };
  return { ok: true, key };
}

/** A suggestion only. The caller must wait for a tap before putting the text in the field. */
export function copiedKeyOffer(raw: string, currentValue: string): string | null {
  const next = tidyGeminiKey(raw);
  if (!next.ok) return null;
  const current = tidyGeminiKey(currentValue);
  if (current.ok && current.key === next.key) return null;
  return next.key;
}

export function geminiKeyIssueMessage(issue: GeminiKeyIssue): string {
  switch (issue) {
    case 'empty':
      return '아직 글자가 없어요. 복사한 뒤 붙여넣기를 눌러 주세요.';
    case 'partial':
      return '글자가 잘린 것 같아요. 앞에서 뒤까지 다시 복사해 주세요.';
    case 'shape':
      return '키가 아닌 글자가 들어간 것 같아요. AI Studio에서 복사 버튼을 눌러 다시 복사해 주세요.';
  }
}

export function geminiVerifyHelp(kind: GeminiKeyFailure): string {
  switch (kind) {
    case 'invalid':
      return '글자가 안 맞아요. 일부만 복사됐으면 처음부터 다시 복사해 주세요.';
    case 'limited':
      return '지금 많이 쓰고 있어요. 잠시 뒤에 다시 연결해 주세요.';
    case 'offline':
      return '인터넷이 꺼져 있어요. 와이파이나 데이터를 켠 뒤 다시 눌러 주세요.';
    case 'failed':
      return '연결이 안 됐어요. 잠시 뒤에 다시 해 주세요.';
    case 'timeout':
      return '시간이 너무 걸렸어요. 다시 시도해 주세요.';
  }
}
