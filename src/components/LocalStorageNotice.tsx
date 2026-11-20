import type React from 'react';
import { localStorageNoticeText, storagePlace } from '../utils/storageNotice';
import { isNativeShell } from '../utils/nativeShell';

interface LocalStorageNoticeProps {
  onBackup: () => void;
}

/** Shown on every tab. Accounts are local, so the risk has to be visible before someone changes phones. */
export const LocalStorageNotice: React.FC<LocalStorageNoticeProps> = ({ onBackup }) => {
  const copy = localStorageNoticeText(storagePlace(isNativeShell(), navigator.userAgent));
  return (
    <div id="local-storage-notice" className="paper mb-3 flex items-center gap-2 rounded-2xl px-3 py-2">
      <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-[#1C160E]">
        기록은 <strong>{copy.lead}</strong>
        {copy.rest}
      </p>
      <button
        id="local-storage-backup-btn"
        type="button"
        onClick={onBackup}
        className="btn-gold shrink-0 rounded-full px-3 text-[11px] font-medium"
      >
        JSON 백업
      </button>
    </div>
  );
};
