/** One or two letters for a cover that has no image. Korean titles use the first syllable. */
export function coverInitials(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return '보';
  const chars = Array.from(trimmed);
  if (/^[가-힣]/.test(trimmed)) return chars[0] ?? '보';
  const words = trimmed.split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = words.map((word) => Array.from(word)[0] ?? '').join('');
  const mark = letters || chars[0] || '보';
  return mark.toUpperCase();
}
