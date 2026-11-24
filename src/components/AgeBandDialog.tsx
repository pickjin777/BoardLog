import { useRef } from 'react';
import { AgeBandChooser } from './AgeBandChooser';
import { useDialogA11y } from './useDialogA11y';

interface AgeBandDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Cream sheet and brass plates. Choosing under 14 does not enable collection. */
export function AgeBandDialog({ isOpen, onClose }: AgeBandDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogA11y(isOpen, onClose, dialogRef);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        id="age-band-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-band-title"
        tabIndex={-1}
        className="w-full max-w-sm rounded-3xl bg-[#F6EBD4] p-6 text-[#1C160E]"
      >
        <AgeBandChooser onDone={onClose} />
        <button
          id="age-band-close"
          type="button"
          onClick={onClose}
          className="btn-cream mt-3 min-h-12 w-full px-3 text-sm"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
