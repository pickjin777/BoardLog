/** Where Tab lands inside a dialog. Empty lists stay empty. */
export function cycleIndex(length: number, index: number, shift: boolean): number {
  if (length <= 0) return -1;
  if (shift) return index <= 0 ? length - 1 : index - 1;
  if (index < 0 || index >= length - 1) return 0;
  return index + 1;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function tabbable(root: ParentNode): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(FOCUSABLE);
  const visible: HTMLElement[] = [];
  for (const el of nodes) {
    if (el.tabIndex < 0) continue;
    if (el.getAttribute('aria-hidden') === 'true') continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    visible.push(el);
  }
  return visible;
}
