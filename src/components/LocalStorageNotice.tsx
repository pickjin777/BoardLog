import type React from 'react';

interface LocalStorageNoticeProps {
  onBackup: () => void;
}

/** Shown on every tab. Accounts are local, so the risk has to be visible before someone changes phones. */
export const LocalStorageNotice: React.FC<LocalStorageNoticeProps> = ({ onBackup }) => {
  return (
    <div id="local-storage-notice" className="paper mb-3 flex items-center gap-2 rounded-2xl px-3 py-2">
      <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-[#1C160E]">
        기록은 <strong>이 기기의 브라우저에만</strong> 저장돼요. 폰을 바꾸거나 브라우저 데이터를 지우면 사라질 수
        있어요.
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
