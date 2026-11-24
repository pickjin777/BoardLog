import { useEffect, useRef, useState } from 'react';
import { storage } from '../services/storage';
import { shouldAnnounceTermsChange, TERMS_VERSION } from '../utils/termsNotice';
import { useDialogA11y } from './useDialogA11y';

/**
 * Quiet on the first launch. After a terms version bump, the next open tells the person and
 * how to back up and stop if they do not agree.
 */
export function TermsChangeNotice() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = storage.getTermsVersion();
    if (shouldAnnounceTermsChange(stored)) {
      setOpen(true);
      return;
    }
    if (!stored) storage.setTermsVersion(TERMS_VERSION);
  }, []);

  useDialogA11y(open, () => setOpen(false), dialogRef);
  if (!open) return null;

  const accept = () => {
    storage.setTermsVersion(TERMS_VERSION);
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        id="terms-change-notice"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-change-title"
        tabIndex={-1}
        className="w-full max-w-sm space-y-3 rounded-3xl bg-[#F6EBD4] p-6 text-[#1C160E]"
      >
        <h2 id="terms-change-title" className="text-base font-semibold">
          이용약관이 바뀌었습니다
        </h2>
        <p className="text-base leading-relaxed">
          일반적인 변경은 7일 전, 불리한 변경은 30일 전에 알립니다. 이 안내는 앱을 열 때 보여 드립니다.
        </p>
        <p className="text-base leading-relaxed">
          동의하지 않으면 마이 화면에서 JSON으로 백업한 뒤, 계정과 이 기기의 기록을 삭제하고 앱 사용을 멈추면 됩니다.
        </p>
        <a href="/terms.html" className="btn-cream flex min-h-12 items-center justify-center px-3 text-sm">
          이용약관 보기
        </a>
        <button
          id="terms-change-accept"
          type="button"
          onClick={accept}
          className="btn-gold min-h-12 w-full px-3 text-sm"
        >
          확인
        </button>
      </div>
    </div>
  );
}
