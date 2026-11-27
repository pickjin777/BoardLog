/**
 * One prompt and one response shape for the Vercel proxy and for a key the user
 * keeps on the device. Neither copy may drift, or the checklist would parse one and not the other.
 */

export const SCAN_MODEL_CANDIDATES = ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-2.5-flash'] as const;

export const SCAN_PROMPT = `You are reading one photograph of physical board game boxes. A single photo may show several boxes at once.

Return every distinct board game whose title you can read. The response is a JSON object with a "games" array. Each item has only:
- "title": the product title printed on that box, in the language printed on the box. Keep Korean titles in Korean. When both a Korean and an English title are printed, use the Korean one.
- "confidence": a number from 0 to 1 for how sure you are of that title.

Titles may be printed in any of these ways. Read all of them:
- Horizontal text across a box face.
- Vertically stacked characters, each one below the previous.
- Horizontal text on a spine, rotated 90 degrees clockwise or counter-clockwise.

Rules:
- One array item per physical box. Never merge two boxes. Never split one box into two.
- Ignore publisher names, taglines, player-count badges, age ratings, awards, barcodes and expansion banners.
- When a title is partly hidden or blurred, report the legible part and lower the confidence.
- When the photo shows no board game box, return an empty "games" array. Do not guess.`;

export const SCAN_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    games: {
      type: 'ARRAY',
      description: 'Every board game read from this one photo',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING', description: 'Title as printed on the box' },
          confidence: { type: 'NUMBER', description: '0 to 1' }
        },
        required: ['title', 'confidence']
      }
    }
  },
  required: ['games']
} as const;
