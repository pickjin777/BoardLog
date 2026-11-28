/**
 * One prompt and one response shape for the Vercel proxy and for a key the user
 * keeps on the device. Neither copy may drift, or the checklist would parse one and not the other.
 *
 * gemini-3.1-flash-lite with minimal thinking was about 1.5s at Gemini on a shelf photo.
 * gemini-2.5-flash and gemini-2.5-flash-lite now 404 for new keys, so they are not candidates.
 */

export const SCAN_MODEL_CANDIDATES = [
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview'
] as const;

/** One model attempt. A slow or overloaded id must not hold the whole chain. */
export const SCAN_CANDIDATE_TIMEOUT_MS = 10_000;

/** The screen gives up after this and offers another try. */
export const SCAN_CLIENT_TIMEOUT_MS = 20_000;

/** Measured setting. A model that rejects it is retried once without this block. */
export const SCAN_THINKING_CONFIG = { thinkingLevel: 'minimal' } as const;

export const SCAN_PROMPT = `Read one photo of board game boxes. Return JSON {"games":[{"title":"","confidence":0}]}.

Rules:
- One item per physical box. Never merge two boxes or split one box.
- Prefer the Korean title printed on the box. If only English is printed, use English.
- Include small and party games, not only large boxes. Examples: 선물입니다, 독수리 눈치싸움.
- Read horizontal titles, vertical stacks, and spine titles rotated 90 degrees.
- Ignore publisher names, taglines, player counts, age marks, awards, and barcodes.
- confidence is from 0 to 1. If nothing is readable, return {"games":[]}. Do not guess.`;

export const SCAN_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    games: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          confidence: { type: 'NUMBER' }
        },
        required: ['title', 'confidence']
      }
    }
  },
  required: ['games']
} as const;
