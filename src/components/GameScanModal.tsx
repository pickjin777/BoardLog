import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Loader2, AlertCircle, Check } from 'lucide-react';
import type { UserGame } from '../types';
import { SEED_GAMES } from '../data/seedGames';
import { formatDate } from '../utils/formatters';
import { storage } from '../services/storage';
import {
  fetchScanAvailable,
  scanGamePhotos,
  type ScanCandidate,
  ScanConsentRequiredError,
  ScanDisabledError,
  ScanFailedError,
  ScanNotConfiguredError,
  MAX_SCAN_IMAGES,
  ONE_PHOTO_LIMIT_MESSAGE
} from '../services/gameScanner';
import { PUBLIC_SCAN_ERROR } from '../utils/publicScanError';
import { scanResultKind, scanResultMessage } from '../utils/scanRecognition';
import { findSeedMatch, normalizeTitle } from '../utils/titleMatch';
import { useDialogA11y } from './useDialogA11y';

type NewGame = Omit<UserGame, 'id' | 'createdAt' | 'updatedAt'>;

/** Applied to a title the seed list does not contain, so the card is usable before it is filled in. */
const UNMATCHED_DEFAULTS = {
  genre: ['미분류'],
  minPlayers: 1,
  maxPlayers: 4,
  recommendedAge: 8,
  playTime: 30,
  weight: 2.0,
  notes: '사진으로 등록했습니다. 상세 정보를 채워주세요.'
} as const;

interface GameScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** False when the server has no scan key. A chosen photo stays on the device. */
  allowRecognition: boolean;
  onManualEntry: () => void;
  existingGames: UserGame[];
  onRegister: (games: NewGame[]) => Promise<void>;
}

export const GameScanModal: React.FC<GameScanModalProps> = ({
  isOpen,
  onClose,
  allowRecognition,
  onManualEntry,
  existingGames,
  onRegister
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const manualSeq = useRef(0);
  const [isScanning, setIsScanning] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishedEmpty, setFinishedEmpty] = useState(false);
  const [candidates, setCandidates] = useState<ScanCandidate[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [excluded, setExcluded] = useState<Record<string, boolean>>({});
  const [manualIds, setManualIds] = useState<Record<string, boolean>>({});
  const [manualEntry, setManualEntry] = useState(false);
  const [pickedLabel, setPickedLabel] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const ownedTitles = useMemo(() => new Set(existingGames.map((g) => normalizeTitle(g.title))), [existingGames]);

  const replacePreview = useCallback((file: File | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const next = file ? URL.createObjectURL(file) : null;
    previewUrlRef.current = next;
    setPreviewUrl(next);
  }, []);

  const reset = useCallback(() => {
    setCandidates([]);
    setTitles({});
    setExcluded({});
    setManualIds({});
    setError(null);
    setFinishedEmpty(false);
    setIsScanning(false);
    setIsSaving(false);
    setManualEntry(false);
    setPickedLabel('');
    replacePreview(null);
  }, [replacePreview]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const handleClose = useCallback(() => {
    reset();
    setConsentChecked(false);
    onClose();
  }, [reset, onClose]);

  const recognitionOn = allowRecognition && storage.isPhotoRecognitionEnabled();
  useDialogA11y(isOpen, handleClose, dialogRef);

  useEffect(() => {
    if (!isOpen) return;
    setHasConsent(storage.hasPhotoScanConsent());
    setConsentChecked(false);
  }, [isOpen]);

  const handleFiles = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const picked = event.target.files;
      const files: File[] = [];
      for (let i = 0; i < (picked?.length ?? 0); i += 1) {
        const file = picked?.item(i);
        if (file) files.push(file);
      }
      event.target.value = '';
      if (files.length === 0) return;
      if (files.length > MAX_SCAN_IMAGES) {
        setError(ONE_PHOTO_LIMIT_MESSAGE);
        setFinishedEmpty(false);
        return;
      }

      const file = files[0];
      replacePreview(file);
      setPickedLabel(file.name);
      setCandidates([]);
      setTitles({});
      setExcluded({});
      setManualIds({});
      setError(null);
      setFinishedEmpty(false);
      if (!recognitionOn || !storage.hasPhotoScanConsent()) {
        setManualEntry(!recognitionOn);
        return;
      }
      const ready = await fetchScanAvailable();
      if (!ready) {
        setManualEntry(true);
        return;
      }

      setIsScanning(true);
      setManualEntry(false);
      try {
        const found = await scanGamePhotos([file]);
        if (found.length === 0) {
          setFinishedEmpty(true);
          setCandidates([]);
          return;
        }
        setCandidates(found);
        setTitles(Object.fromEntries(found.map((c) => [c.id, c.match?.game.title ?? c.detection.title])));
      } catch (err) {
        if (err instanceof ScanNotConfiguredError || err instanceof ScanDisabledError) {
          setManualEntry(true);
          setError(null);
          return;
        }
        if (err instanceof ScanConsentRequiredError) {
          setHasConsent(false);
          setError(null);
          return;
        }
        setError(err instanceof ScanFailedError ? err.message : err instanceof Error ? err.message : PUBLIC_SCAN_ERROR);
      } finally {
        setIsScanning(false);
      }
    },
    [recognitionOn, replacePreview]
  );

  const updateTitle = useCallback((id: string, value: string) => {
    setTitles((prev) => ({ ...prev, [id]: value }));
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === id ? { ...candidate, match: findSeedMatch(value, SEED_GAMES) } : candidate
      )
    );
  }, []);

  const addManual = useCallback(() => {
    manualSeq.current += 1;
    const id = `manual_${manualSeq.current}`;
    setFinishedEmpty(false);
    setManualIds((prev) => ({ ...prev, [id]: true }));
    setCandidates((prev) => [...prev, { id, detection: { title: '', confidence: 0 }, match: null }]);
    setTitles((prev) => ({ ...prev, [id]: '' }));
  }, []);

  const selected = useMemo(
    () => candidates.filter((c) => !excluded[c.id] && (titles[c.id] ?? '').trim().length > 0),
    [candidates, excluded, titles]
  );

  const summary = candidates.length > 0 ? scanResultMessage(scanResultKind(candidates)) : null;

  const handleRegister = useCallback(async () => {
    if (selected.length === 0) return;
    setIsSaving(true);
    setError(null);

    const games: NewGame[] = selected.map((candidate) => {
      const title = (titles[candidate.id] ?? '').trim();
      const seed = candidate.match?.game;
      return {
        title,
        titleEn: seed?.titleEn ?? '',
        imageUrl: seed?.imageUrl ?? '',
        genre: seed ? [...seed.genre] : [...UNMATCHED_DEFAULTS.genre],
        minPlayers: seed?.minPlayers ?? UNMATCHED_DEFAULTS.minPlayers,
        maxPlayers: seed?.maxPlayers ?? UNMATCHED_DEFAULTS.maxPlayers,
        bestPlayers: seed?.bestPlayers ?? '',
        recommendedAge: seed?.recommendedAge ?? UNMATCHED_DEFAULTS.recommendedAge,
        playTime: seed?.playTime ?? UNMATCHED_DEFAULTS.playTime,
        weight: seed?.weight ?? UNMATCHED_DEFAULTS.weight,
        publisher: seed?.publisher ?? '',
        purchaseDate: formatDate(),
        purchasePrice: 0,
        originalPrice: 0,
        marketPrice: 0,
        storageLocation: '',
        condition: '상',
        tags: seed ? [...seed.genre] : [...UNMATCHED_DEFAULTS.genre],
        notes: seed?.description ?? UNMATCHED_DEFAULTS.notes,
        ownershipStatus: '보유중',
        playCount: 0,
        priceMeta: { source: '사진 인식 등록', verifiedDate: formatDate(), isManual: false }
      };
    });

    try {
      await onRegister(games);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [selected, titles, onRegister, reset, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
        >
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            ref={dialogRef}
            id="scan-modal-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="scan-modal-title"
            tabIndex={-1}
            className="bg-[#172033] text-[#F6EBD4] w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl border border-[#C6A36A]"
          >
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-[#243044] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-[#E2B657]/10 text-[#E2B657] flex items-center justify-center">
                  <Camera className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 id="scan-modal-title" className="text-base font-black text-[#F6EBD4]">
                    사진으로 등록
                  </h2>
                  <p className="text-[11px] text-[#E4D3B4]">사진 한 장에서 여러 게임을 읽어 한 번에 넣습니다</p>
                </div>
              </div>
              <button
                id="scan-modal-close-btn"
                type="button"
                aria-label="닫기"
                onClick={handleClose}
                className="p-1.5 text-[#636E72] hover:text-[#1E272E] rounded-full hover:bg-[#F1F3F5] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <input
                id="scan-file-input"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFiles}
                className="hidden"
              />

              {candidates.length === 0 && !isScanning && !manualEntry && recognitionOn && !hasConsent && (
                <div
                  id="scan-consent-dialog"
                  className="space-y-3 rounded-2xl border border-[#C6B48A] bg-[#F6EBD4] p-4"
                >
                  <h3 className="text-sm font-medium text-[#1C160E]">사진 인식 안내</h3>
                  <p className="text-xs leading-relaxed text-[#1C160E]">
                    고른 사진(최대 {MAX_SCAN_IMAGES}장)은 이 기기에서 크기를 줄이고, 위치 등 사진에 붙은 정보(EXIF)를
                    제거한 뒤 보드로그 서버를 거쳐 Google Gemini로 보내 게임 이름을 읽는 데 쓰입니다. 보드로그는 이
                    사진을 저장하지 않습니다.
                  </p>
                  <label
                    className="flex min-h-12 items-center gap-2 text-xs text-[#1C160E]"
                    htmlFor="scan-consent-check"
                  >
                    <input
                      id="scan-consent-check"
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(event) => setConsentChecked(event.target.checked)}
                    />
                    위 내용을 확인했습니다
                  </label>
                  <div className="flex gap-2">
                    <button
                      id="scan-consent-decline"
                      type="button"
                      onClick={handleClose}
                      className="min-h-12 flex-1 rounded-full bg-[#243044] px-3 text-xs font-medium text-[#F6EBD4]"
                    >
                      동의하지 않음
                    </button>
                    <button
                      id="scan-consent-confirm"
                      type="button"
                      disabled={!consentChecked}
                      onClick={() => {
                        storage.grantPhotoScanConsent();
                        setHasConsent(true);
                        setConsentChecked(false);
                      }}
                      className="btn-gold min-h-12 flex-1 rounded-full px-3 text-xs font-medium disabled:opacity-50"
                    >
                      동의하고 계속
                    </button>
                  </div>
                </div>
              )}

              {previewUrl && (
                <div id="scan-photo-preview" className="flex items-center gap-3">
                  <img
                    src={previewUrl}
                    alt="고른 상자 사진"
                    className="h-24 w-24 rounded-xl border border-[#C6A36A] bg-[#0E1628] object-contain"
                  />
                  <p className="min-w-0 break-all text-[11px] leading-relaxed text-[#E4D3B4]">
                    사진 1장
                    {pickedLabel ? ` · ${pickedLabel}` : ''}
                  </p>
                </div>
              )}

              {finishedEmpty && candidates.length === 0 && !isScanning && !error && (
                <p
                  id="scan-empty-result"
                  role="status"
                  className="rounded-2xl border border-[#C6B48A] bg-[#F6EBD4] p-4 text-xs leading-relaxed text-[#1C160E]"
                >
                  {scanResultMessage('empty')}
                </p>
              )}

              {candidates.length === 0 && !isScanning && !manualEntry && (!recognitionOn || hasConsent) && (
                <button
                  id="scan-pick-photos-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-10 border-2 border-dashed border-[#C6A36A] bg-[#243044] rounded-2xl flex flex-col items-center gap-2 text-[#F6EBD4]"
                >
                  <Camera className="w-7 h-7 text-[#E2B657]" />
                  <span className="text-xs font-bold">사진 1장 고르기</span>
                  <span className="text-[11px] text-[#E4D3B4]">
                    {allowRecognition
                      ? '찍거나 고른 한 장으로 바꿉니다. 박스 여러 개도 됩니다.'
                      : '인식 설정이 없으면 이름은 읽지 않고, 고른 사진은 기기에만 있습니다'}
                  </span>
                </button>
              )}

              {manualEntry && (
                <div
                  id="scan-manual-fallback"
                  className="rounded-2xl border border-[#C6B48A] bg-[#F6EBD4] p-4 text-[#1C160E]"
                >
                  <p className="text-xs font-bold">이 사진에서 이름을 읽지 않았습니다.</p>
                  <p className="mt-1 break-all text-[11px] leading-relaxed">
                    인식 설정이 없어 고른 사진은 서버로 보내지 않았습니다.
                    {pickedLabel ? ` 선택한 파일: ${pickedLabel}` : ''}
                  </p>
                  <button
                    id="scan-manual-entry-btn"
                    type="button"
                    onClick={onManualEntry}
                    className="btn-gold mt-3 inline-flex min-h-12 rounded-full px-4 text-[11px] font-bold"
                  >
                    직접 입력으로 등록
                  </button>
                </div>
              )}

              {isScanning && (
                <div className="py-12 flex flex-col items-center gap-3">
                  <Loader2 className="w-7 h-7 text-[#E2B657] animate-spin" />
                  <span className="text-xs font-bold text-[#F6EBD4]">사진에서 게임 이름을 읽는 중…</span>
                  <span className="text-[11px] text-[#E4D3B4]">10초 정도 걸릴 수 있습니다</span>
                </div>
              )}

              {error && (
                <div
                  id="scan-error"
                  role="alert"
                  className="flex items-start gap-2 p-3 bg-[#FDECEA] border border-[#F5C6C2] rounded-2xl"
                >
                  <AlertCircle className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#C0392B] leading-relaxed whitespace-pre-line break-all">{error}</p>
                </div>
              )}

              {(candidates.length > 0 || finishedEmpty) && !isScanning && !manualEntry && (
                <button
                  id="scan-add-manual-btn"
                  type="button"
                  onClick={addManual}
                  className="btn-quiet min-h-12 w-full"
                >
                  빠뜨린 게임 직접 적기
                </button>
              )}

              {candidates.length > 0 && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#F6EBD4]">
                      {candidates.length}개 인식 · {selected.length}개 선택됨
                    </span>
                    <button
                      id="scan-rescan-btn"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-quiet min-h-12 px-3 text-[11px]"
                    >
                      다시 찍기
                    </button>
                  </div>

                  {summary && (
                    <p
                      id="scan-result-summary"
                      role="status"
                      className="rounded-2xl border border-[#C6B48A] bg-[#F6EBD4] p-3 text-xs leading-relaxed text-[#1C160E]"
                    >
                      {summary}
                    </p>
                  )}

                  <ul id="scan-result-list" className="space-y-2">
                    {candidates.map((candidate) => {
                      const title = titles[candidate.id] ?? '';
                      const isOff = !!excluded[candidate.id];
                      const owned = ownedTitles.has(normalizeTitle(title));
                      const isManual = !!manualIds[candidate.id];

                      return (
                        <li key={candidate.id} className="rounded-[20px] border border-[#C6B48A] bg-[#F6EBD4] p-3">
                          <div className="flex items-start gap-2">
                            <button
                              id={`scan-toggle-${candidate.id}`}
                              type="button"
                              aria-pressed={!isOff}
                              aria-label={
                                isOff ? `${title || '이 게임'} 추가에 포함` : `${title || '이 게임'} 추가에서 빼기`
                              }
                              onClick={() => setExcluded((prev) => ({ ...prev, [candidate.id]: !prev[candidate.id] }))}
                              className={`flex items-center justify-center rounded-lg border ${
                                isOff
                                  ? 'border-[#C6A36A] bg-[#172033] text-[#F6EBD4]'
                                  : 'border-[#0E1628] bg-[#0E1628] text-[#F6EBD4]'
                              }`}
                            >
                              {!isOff && <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <input
                                id={`scan-title-${candidate.id}`}
                                type="text"
                                aria-label="게임 이름"
                                value={title}
                                onChange={(e) => updateTitle(candidate.id, e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-[#FFF8EC] border border-[#C6B48A] rounded-xl text-xs font-bold text-[#1C160E]"
                              />

                              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                {candidate.match ? (
                                  <span className="px-2 py-0.5 bg-[#E8F3ED] text-[#1B6B43] rounded-full text-[10px] font-bold">
                                    목록과 맞음 {Math.round(candidate.match.score * 100)}%
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-[#172033] text-[#F6EBD4] rounded-full text-[10px] font-bold">
                                    {isManual ? '직접 입력' : '목록에 없음'}
                                  </span>
                                )}
                                {!isManual && candidate.detection.title && (
                                  <span className="px-2 py-0.5 bg-[#E7D7B8] text-[#5C4632] rounded-full text-[10px] font-bold">
                                    확신 {Math.round(candidate.detection.confidence * 100)}%
                                  </span>
                                )}
                                {owned && (
                                  <span className="px-2 py-0.5 bg-[#FDECEA] text-[#C0392B] rounded-full text-[10px] font-bold">
                                    이미 보유 중
                                  </span>
                                )}
                              </div>

                              {candidate.detection.title && candidate.detection.title !== title && (
                                <p className="text-[10px] text-[#5C4632] mt-1">
                                  사진에서 읽은 값: {candidate.detection.title}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>

            {candidates.length > 0 && (
              <div className="p-4 sm:p-6 border-t border-[#243044] flex gap-2 shrink-0">
                <button
                  id="scan-cancel-btn"
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="btn-quiet min-h-12 px-4 text-xs disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  id="scan-register-btn"
                  type="button"
                  onClick={handleRegister}
                  disabled={isSaving || selected.length === 0}
                  className="btn-gold min-h-12 flex-1 text-xs disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? '등록 중…' : `${selected.length}개 추가하기`}</span>
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
