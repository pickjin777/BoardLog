import type React from 'react';
import { useRef, useState } from 'react';
import { Database, Download, LogOut, CheckCircle2, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { track } from '../services/analytics';
import { storage, type ImportPlan } from '../services/storage';
import { CONTACT, contactHref } from '../config/contact';
import { parseBackup, MAX_BACKUP_BYTES } from '../utils/backupImport';
import { isNativeShell } from '../utils/nativeShell';
import { storagePlace } from '../utils/storageNotice';
import { ConfirmModal } from './ConfirmModal';
import { PrivacyNoticeModal } from './PrivacyNoticeModal';

interface MyPageViewProps {
  onOpenAuth: () => void;
  onOpenCatalog?: () => void;
  onDataImported?: () => void;
}

export const MyPageView: React.FC<MyPageViewProps> = ({ onOpenAuth, onOpenCatalog, onDataImported }) => {
  const { user, signOut, updateNickname, deleteAccount } = useAuth();
  const { showToast } = useToast();

  const [isEditingNick, setIsEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState(user?.nickname || '');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<ImportPlan | null>(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [scanOn, setScanOn] = useState(() => storage.isPhotoRecognitionEnabled());
  const [scanConsent, setScanConsent] = useState(() => storage.hasPhotoScanConsent());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const place = storagePlace(isNativeShell(), navigator.userAgent);
  const contactLink = contactHref(CONTACT);

  const handleBackupChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    if (file.size > MAX_BACKUP_BYTES) {
      showToast('백업 파일이 너무 큽니다.', 'error');
      return;
    }

    setIsImporting(true);
    try {
      const plan = await storage.planImport(user.uid, parseBackup(await file.text()));
      if (plan.newGames.length === 0 && plan.newPlays.length === 0) {
        showToast('새로 추가할 데이터가 없습니다. 이미 모두 들어 있어요.', 'info');
        return;
      }
      setPendingImport(plan);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '백업 파일을 읽지 못했습니다.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!user || !pendingImport) return;
    const plan = pendingImport;
    setPendingImport(null);
    setIsImporting(true);
    try {
      await storage.commitImport(user.uid, plan);
      track('backup_restored');
      showToast(`게임 ${plan.newGames.length}개, 플레이 기록 ${plan.newPlays.length}개를 복원했습니다.`, 'success');
      onDataImported?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '복원 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const importSummary = pendingImport
    ? [
        `게임 ${pendingImport.newGames.length}개, 플레이 기록 ${pendingImport.newPlays.length}개를 추가합니다.`,
        pendingImport.skippedGames + pendingImport.skippedPlays > 0
          ? `이미 있는 게임 ${pendingImport.skippedGames}개, 기록 ${pendingImport.skippedPlays}개는 건너뜁니다.`
          : '',
        pendingImport.invalidCount > 0 ? `형식이 잘못된 항목 ${pendingImport.invalidCount}개는 제외됩니다.` : '',
        '기존 데이터는 지워지지 않습니다.'
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await deleteAccount();
      setIsDeleteOpen(false);
      showToast('이 계정의 기록과 로그인 정보를 이 기기에서 지웠습니다.', 'info');
      onDataImported?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };
  const handleSaveNickname = async () => {
    if (!nickInput.trim()) return;
    try {
      await updateNickname(nickInput.trim());
      setIsEditingNick(false);
      showToast('닉네임이 수정되었습니다.', 'success');
    } catch {
      showToast('닉네임 수정 실패', 'error');
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const jsonStr = await storage.exportUserDataJson(user.uid);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boardlog_backup_${user.nickname}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      track('backup_exported');
      showToast('데이터 백업 파일이 다운로드되었습니다.', 'success');
    } catch {
      showToast('데이터 내보내기 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5 pb-20 lg:mx-auto lg:max-w-3xl">
      {/* Profile Card */}
      <div className="p-5 bg-white rounded-2xl border border-[#E9ECEF] shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-[#3A2C22] text-[#F6EBD4] font-black text-lg flex items-center justify-center">
              {user?.nickname ? user.nickname.slice(0, 1).toUpperCase() : 'B'}
            </div>
            <div className="min-w-0">
              {isEditingNick ? (
                <div className="flex items-center gap-1.5">
                  <input
                    id="mypage-nickname-input"
                    type="text"
                    aria-label="닉네임"
                    value={nickInput}
                    onChange={(e) => setNickInput(e.target.value)}
                    className="min-w-0 px-2.5 py-1 bg-[#F1F3F5] border border-[#E9ECEF] rounded-xl text-xs font-bold text-[#1E272E] focus:outline-hidden focus:border-[#4834D4]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveNickname}
                    className="px-3 py-1 bg-[#4834D4] text-white rounded-xl text-xs font-bold"
                  >
                    저장
                  </button>
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-1.5">
                  <h2 className="min-w-0 text-base font-black text-[#1E272E]">{user?.nickname || '사용자'}</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setNickInput(user?.nickname || '');
                      setIsEditingNick(true);
                    }}
                    className="text-[10px] text-[#636E72] hover:text-[#4834D4] underline"
                  >
                    수정
                  </button>
                </div>
              )}
              <p className="text-xs text-[#636E72] mt-0.5">{user?.isAnonymous ? '게스트 계정' : user?.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAuth}
            className="shrink-0 px-4 py-1.5 bg-[#F1F3F5] hover:bg-[#E9ECEF] text-[#2D3436] rounded-full text-xs font-bold transition-colors"
          >
            {user?.isAnonymous ? '로그인 / 가입' : '계정 관리'}
          </button>
        </div>

        {/* Status Tag */}
        <div
          id="mypage-storage-status"
          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-2xl border border-[#E9ECEF] bg-[#F8F9FA] p-3 text-xs text-[#636E72]"
        >
          <span>저장 위치</span>
          <span className="flex items-center gap-1 font-bold text-[#1B7A43]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>이 기기에만 저장됨</span>
          </span>
        </div>
      </div>

      {/* External Data Honesty & Database Status Card */}
      <div className="p-4 bg-white rounded-2xl border border-[#E9ECEF] shadow-sm space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-[#1E272E]">
          <Database className="w-4 h-4 text-[#4834D4]" />
          <span>저장</span>
        </div>
        <p className="text-[11px] text-[#636E72] leading-relaxed">
          기록은 {place === 'device' ? '이 기기에' : '이 브라우저에'} 남습니다. 새로고침해도 유지됩니다. 외부 게임
          데이터베이스는 연결되지 않았습니다. 앱에 넣어 둔 게임 목록과 직접 입력으로 게임을 찾습니다.
        </p>
      </div>

      <div
        id="settings-photo-recognition"
        className="space-y-3 rounded-2xl border border-[#E9ECEF] bg-white p-4 shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-[#1E272E]">사진 인식</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-[#636E72]">
              끄면 사진을 서버로 보내지 않습니다. 동의는 미리 체크되지 않습니다.
            </p>
          </div>
          <button
            id="settings-photo-recognition-toggle"
            type="button"
            role="switch"
            aria-checked={scanOn}
            onClick={() => {
              const next = !scanOn;
              storage.setPhotoRecognitionEnabled(next);
              setScanOn(next);
            }}
            className={`min-h-12 shrink-0 rounded-full px-4 text-xs font-bold ${
              scanOn ? 'bg-[#E2B657] text-[#1A1408]' : 'bg-[#F1F3F5] text-[#1C160E]'
            }`}
          >
            {scanOn ? '켜짐' : '꺼짐'}
          </button>
        </div>
        {scanConsent ? (
          <button
            id="settings-scan-consent-revoke"
            type="button"
            onClick={() => {
              storage.revokePhotoScanConsent();
              setScanConsent(false);
            }}
            className="min-h-12 w-full rounded-full bg-[#F1F3F5] text-xs font-bold text-[#1C160E]"
          >
            사진 인식 동의 철회
          </button>
        ) : (
          <p className="text-[11px] text-[#636E72]">다음 사진 인식 때 안내를 확인하고 동의해야 합니다.</p>
        )}
      </div>

      <div id="settings-contact-card" className="space-y-2 rounded-2xl border border-[#E9ECEF] bg-white p-4 shadow-sm">
        <h3 className="text-xs font-bold text-[#1E272E]">문의</h3>
        {contactLink ? (
          <a
            id="settings-contact"
            href={contactLink}
            className="flex min-h-12 items-center justify-center rounded-full bg-[#E2B657] text-xs font-bold text-[#1A1408]"
          >
            문의하기
          </a>
        ) : (
          <button
            id="settings-contact"
            type="button"
            disabled
            className="min-h-12 w-full rounded-full bg-[#F1F3F5] text-xs font-bold text-[#636E72]"
          >
            문의
          </button>
        )}
        {!contactLink && (
          <p className="text-[11px] leading-relaxed text-[#636E72]">
            개발자 이름, 메일, 공개 주소는 아직 정해지지 않았습니다.
          </p>
        )}
      </div>

      {/* Backup / Export Section */}
      <div className="p-4 bg-white rounded-2xl border border-[#E9ECEF] shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[#1E272E] flex items-center gap-1.5">
          <Download className="w-4 h-4 text-[#4834D4]" />
          <span>백업과 도록</span>
        </h3>
        <p className="text-[11px] text-[#636E72] leading-relaxed">
          PDF 도록으로 인쇄하거나 JSON으로 저장합니다. 기록은 이 기기에만 있으니 기기를 바꾸거나 앱을 지우기 전에
          백업하세요.
        </p>

        <div className="space-y-2">
          {onOpenCatalog && (
            <button
              id="mypage-open-catalog-btn"
              type="button"
              onClick={onOpenCatalog}
              className="w-full py-2.5 bg-[#4834D4] hover:bg-[#3c2ab9] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>PDF 도록</span>
            </button>
          )}

          <button
            id="export-json-btn"
            type="button"
            disabled={isExporting}
            onClick={handleExportData}
            className="w-full py-2.5 bg-[#F1F3F5] hover:bg-[#E9ECEF] text-[#2D3436] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#4834D4]" />
            <span>{isExporting ? '파일 생성 중...' : 'JSON 백업'}</span>
          </button>

          <button
            id="import-json-btn"
            type="button"
            disabled={isImporting}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 bg-[#F1F3F5] hover:bg-[#E9ECEF] text-[#2D3436] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-[#4834D4]" />
            <span>{isImporting ? '백업 확인 중...' : '백업 파일로 복원'}</span>
          </button>
          <input
            ref={fileInputRef}
            id="import-json-input"
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleBackupChosen}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={!!pendingImport}
        title="백업 복원"
        message={importSummary}
        confirmText="복원하기"
        onConfirm={handleConfirmImport}
        onCancel={() => setPendingImport(null)}
      />
      <ConfirmModal
        isOpen={isDeleteOpen}
        title="계정과 기록을 삭제할까요?"
        message="이 계정의 게임, 플레이, 로그인 정보를 이 기기에서 지웁니다. 다른 계정은 남습니다. 서버에는 계정이 없습니다. 지운 뒤에는 되돌릴 수 없습니다."
        confirmText={isDeleting ? '삭제 중...' : '삭제하기'}
        onConfirm={handleDeleteAccount}
        onCancel={() => {
          if (!isDeleting) setIsDeleteOpen(false);
        }}
      />

      <button
        id="mypage-delete-account-btn"
        type="button"
        onClick={() => setIsDeleteOpen(true)}
        className="w-full py-3 bg-white border border-[#EB4D4B]/40 hover:bg-[#FEEBEC] text-[#EB4D4B] rounded-2xl text-xs font-bold transition-colors shadow-sm"
      >
        계정과 이 기기의 기록 삭제
      </button>
      <a
        id="mypage-account-deletion-link"
        href="/account-deletion/"
        className="flex min-h-12 items-center justify-center text-center text-[11px] font-bold text-[#636E72] underline underline-offset-2"
      >
        계정 삭제 안내 페이지
      </a>

      <button
        id="mypage-privacy-btn"
        type="button"
        onClick={() => setIsPrivacyOpen(true)}
        className="w-full py-2 text-[11px] font-bold text-[#636E72] hover:text-[#2D3436] underline underline-offset-2 transition-colors"
      >
        개인정보·이용 통계 안내
      </button>
      <PrivacyNoticeModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

      {/* Sign out */}
      <div className="pt-2">
        <button
          id="mypage-logout-btn"
          type="button"
          onClick={() => {
            signOut();
            showToast('로그아웃 되었습니다.', 'info');
          }}
          className="w-full py-3 bg-white border border-[#E9ECEF] hover:bg-[#F8F9FA] text-[#636E72] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <LogOut className="w-4 h-4 text-[#636E72]" />
          <span>로그아웃 (게스트 모드로 전환)</span>
        </button>
      </div>
    </div>
  );
};
