import { useEffect, useRef, type RefObject } from 'react';
import { cycleIndex, tabbable } from '../utils/dialogFocus';

const stack: HTMLElement[] = [];

/** Escape closes the top dialog, Tab stays inside it, and focus returns to the trigger. */
export function useDialogA11y(isOpen: boolean, onClose: () => void, dialogRef: RefObject<HTMLElement | null>): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const root = dialogRef.current;
    if (!root) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    stack.push(root);
    const initial = tabbable(root);
    (initial[0] ?? root).focus();

    const onKey = (event: KeyboardEvent) => {
      if (stack[stack.length - 1] !== root) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = tabbable(root);
      if (items.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }
      const index = items.indexOf(document.activeElement as HTMLElement);
      const atStart = index <= 0;
      const atEnd = index < 0 || index === items.length - 1;
      if ((event.shiftKey && atStart) || (!event.shiftKey && atEnd)) {
        event.preventDefault();
        items[cycleIndex(items.length, index, event.shiftKey)]?.focus();
      }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      const at = stack.lastIndexOf(root);
      if (at >= 0) stack.splice(at, 1);
      if (trigger && document.contains(trigger)) trigger.focus();
    };
  }, [isOpen, dialogRef]);
}
