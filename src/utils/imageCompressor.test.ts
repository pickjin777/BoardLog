import { describe, expect, it } from 'vitest';
import { imageKind } from './imageCompressor';

describe('imageKind', () => {
  it('accepts jpeg, png, and webp, including an empty Android type with an extension', () => {
    expect(imageKind({ type: 'image/jpeg', name: 'a.jpg' })).toBe('ok');
    expect(imageKind({ type: 'image/png', name: 'a.png' })).toBe('ok');
    expect(imageKind({ type: 'image/webp', name: 'a.webp' })).toBe('ok');
    expect(imageKind({ type: '', name: 'photo.JPG' })).toBe('ok');
    expect(imageKind({ type: 'application/octet-stream', name: 'photo.jpeg' })).toBe('ok');
  });

  it('rejects HEIC on its own and refuses other files', () => {
    expect(imageKind({ type: 'image/heic', name: 'a.jpg' })).toBe('heic');
    expect(imageKind({ type: '', name: 'a.HEIC' })).toBe('heic');
    expect(imageKind({ type: 'image/gif', name: 'a.gif' })).toBe('unsupported');
    expect(imageKind({ type: '', name: 'notes.txt' })).toBe('unsupported');
  });
});
