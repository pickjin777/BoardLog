import { Suspense, useState, type ReactNode } from 'react';

/** True after the first time `open` is true, including that render. */
export function useOnceOpened(open: boolean): boolean {
  const [opened, setOpened] = useState(open);
  if (open && !opened) setOpened(true);
  return opened;
}

export function ModalFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="status">
      <p className="paper rounded-3xl px-4 py-4 text-sm text-[#1C160E]">불러오는 중</p>
    </div>
  );
}

/**
 * The chunk stays unloaded until the dialog is opened once.
 * After that the dialog stays mounted so closing it behaves as it does today.
 */
export function MountAfterOpen({ open, children }: { open: boolean; children: ReactNode }) {
  const opened = useOnceOpened(open);
  if (!opened) return null;
  return <Suspense fallback={open ? <ModalFallback /> : null}>{children}</Suspense>;
}
