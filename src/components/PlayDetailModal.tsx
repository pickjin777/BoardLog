import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Clock, Calendar, MapPin, Users, Star, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import type { PlayPhoto, PlayRecord } from '../types';
import { formatDuration } from '../utils/formatters';
import { applyImageFallback } from '../utils/imageFallback';

function photoOpenName(photo: PlayPhoto, index: number): string {
  const base = `현장 사진 ${index + 1}`;
  return photo.caption ? `${base}, ${photo.caption} 확대` : `${base} 확대`;
}

interface PlayDetailModalProps {
  play: PlayRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (play: PlayRecord) => void;
  onDelete: (play: PlayRecord) => void;
}

export const PlayDetailModal: React.FC<PlayDetailModalProps> = ({ play, isOpen, onClose, onEdit, onDelete }) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const photoButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const lightboxCloseRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusIndex = useRef<number | null>(null);

  const playId = play?.id ?? null;
  const [openPlayId, setOpenPlayId] = useState<string | null>(null);
  if (!isOpen && openPlayId !== null) {
    setOpenPlayId(null);
    setSelectedPhotoIndex(null);
    returnFocusIndex.current = null;
  } else if (isOpen && playId !== openPlayId) {
    setOpenPlayId(playId);
    setSelectedPhotoIndex(null);
    returnFocusIndex.current = null;
  }

  const openPhoto = (index: number) => {
    returnFocusIndex.current = index;
    setSelectedPhotoIndex(index);
  };

  const closePhoto = () => setSelectedPhotoIndex(null);

  useEffect(() => {
    if (!isOpen || selectedPhotoIndex === null) {
      if (!isOpen || returnFocusIndex.current === null) return;
      const index = returnFocusIndex.current;
      returnFocusIndex.current = null;
      photoButtons.current[index]?.focus();
      return;
    }

    lightboxCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSelectedPhotoIndex(null);
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        lightboxCloseRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, selectedPhotoIndex]);

  if (!isOpen || !play) return null;

  return (
    <AnimatePresence>
      <div
        id="play-detail-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          exit={{ opacity: 0, y: 8 }}
          className="w-full max-w-lg md:max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E9ECEF] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#E9ECEF] bg-white">
            <div className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5">
              <img
                src={
                  play.gameImageUrl ||
                  'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80'
                }
                alt={play.gameTitle}
                referrerPolicy="no-referrer"
                onError={applyImageFallback}
                className="row-span-2 w-12 h-12 rounded-2xl object-cover bg-stone-200 border border-[#E9ECEF] shadow-sm"
              />
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                <h2 className="max-w-full truncate text-base font-black text-[#1E272E]">{play.gameTitle}</h2>
                <span
                  className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    play.myResult === '승리'
                      ? 'bg-[#4834D4]/10 text-[#4834D4] border-[#4834D4]/20'
                      : 'bg-[#F1F3F5] text-[#636E72] border-[#E9ECEF]'
                  }`}
                >
                  {play.myResult === '승리' ? '내 승리' : play.myResult}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(play)}
                  className="p-2 text-[#636E72] hover:text-[#4834D4] rounded-full hover:bg-[#F1F3F5] transition-colors"
                  aria-label="기록 수정"
                  title="기록 수정"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(play)}
                  className="p-2 text-[#636E72] hover:text-[#EB4D4B] rounded-full hover:bg-[#F1F3F5] transition-colors"
                  aria-label="기록 삭제"
                  title="기록 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-[#636E72] hover:text-[#1E272E] rounded-full hover:bg-[#F1F3F5] transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p
                id="play-detail-when"
                className="col-start-2 col-span-2 text-xs text-[#636E72] flex flex-wrap items-center gap-x-1 gap-y-0.5 font-medium"
              >
                <Calendar className="w-3 h-3 shrink-0 text-[#636E72]" />
                <span>{play.date}</span>
                <span>•</span>
                <Clock className="w-3 h-3 shrink-0 text-[#636E72]" />
                <span>{formatDuration(play.durationMinutes)}</span>
              </p>
            </div>
          </div>

          {/* Body Scroll Area */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {/* Meta bar */}
            <div className="grid grid-cols-3 gap-2 p-4 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] text-center text-xs">
              <div>
                <span className="text-[10px] text-[#636E72] block mb-0.5 font-bold">장소</span>
                <span className="font-bold text-[#1E272E] flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3 text-[#4834D4]" />
                  {play.location || '미입력'}
                </span>
              </div>
              <div className="border-x border-[#E9ECEF]">
                <span className="text-[10px] text-[#636E72] block mb-0.5 font-bold">플레이 시간대</span>
                <span className="font-bold text-[#1E272E]">
                  {play.startTime} ~ {play.endTime}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#636E72] block mb-0.5 font-bold">만족도</span>
                <div
                  className="flex items-center justify-center gap-0.5"
                  role="img"
                  aria-label={`만족도 ${play.rating}점`}
                >
                  {[...Array(5)].map((_, i) => (
                    <Star
                      // biome-ignore lint/suspicious/noArrayIndexKey: static, never reordered list; no stable id exists
                      key={i}
                      aria-hidden="true"
                      className={`w-3 h-3 ${i < play.rating ? 'text-[#B8860B] fill-[#B8860B]' : 'text-[#636E72]'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Participants Leaderboard */}
            <div>
              <h3 className="text-xs font-bold text-[#1E272E] mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#636E72]" />
                <span>참여자 순위 & 점수표</span>
              </h3>

              <div className="bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] overflow-hidden divide-y divide-[#E9ECEF]">
                {play.participants.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className={`p-4 flex items-center justify-between text-xs ${
                      p.isWinner ? 'bg-[#4834D4]/5 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          p.rank === 1 || p.isWinner
                            ? 'bg-[#4834D4] text-white shadow-xs'
                            : p.rank === 2
                              ? 'bg-[#636E72] text-white'
                              : 'bg-[#E9ECEF] text-[#636E72]'
                        }`}
                      >
                        {p.rank || idx + 1}
                      </span>
                      <span className="text-[#1E272E] flex items-center gap-1">
                        {p.name}
                        {p.name === '나' && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-[#4834D4]/10 text-[#4834D4] rounded-full font-bold">
                            본인
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {p.score !== null && <span className="font-black text-[#1E272E] text-sm">{p.score}점</span>}
                      {p.isWinner && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4834D4] bg-[#4834D4]/10 px-2.5 py-0.5 rounded-full">
                          <Trophy className="w-3 h-3" />
                          <span>승리</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photos Gallery */}
            {play.photos && play.photos.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-[#1E272E] mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#636E72]" />
                  <span>현장 사진 ({play.photos.length}장)</span>
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  {play.photos.map((photo, pIdx) => (
                    <button
                      key={photo.id || pIdx}
                      type="button"
                      ref={(node) => {
                        photoButtons.current[pIdx] = node;
                      }}
                      onClick={() => openPhoto(pIdx)}
                      aria-label={photoOpenName(photo, pIdx)}
                      className="group relative block w-full min-w-0 p-0 text-left rounded-2xl overflow-hidden border border-[#E9ECEF] bg-[#F1F3F5] aspect-square cursor-pointer shadow-xs"
                    >
                      <img
                        src={photo.url}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={applyImageFallback}
                        className="w-full h-full object-cover transition-transform"
                      />
                      {photo.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 text-[9px] text-white truncate">
                          {photo.caption}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Review Note */}
            {play.review && (
              <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF] text-xs text-[#1E272E] space-y-1">
                <span className="text-[10px] font-bold text-[#636E72] block">플레이 소감 & 전략 메모</span>
                <p className="leading-relaxed whitespace-pre-line text-[#636E72]">{play.review}</p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-[#E9ECEF] bg-white flex items-center justify-between">
            <span className="text-[11px] text-[#636E72] font-medium">작성일: {play.createdAt || play.date}</span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#4834D4] hover:bg-[#3c2ab9] text-white text-xs font-bold rounded-full transition-colors"
            >
              확인
            </button>
          </div>
        </motion.div>

        {/* Photo Lightbox Popup */}
        {selectedPhotoIndex !== null && play.photos[selectedPhotoIndex] && (
          <div
            id="photo-lightbox-modal"
            role="dialog"
            aria-modal="true"
            aria-label="확대 사진"
            className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4"
          >
            <button
              type="button"
              tabIndex={-1}
              aria-label="바깥을 눌러 확대 사진 닫기"
              className="absolute inset-0 cursor-default"
              onClick={closePhoto}
            />
            <div className="relative z-10 max-w-lg w-full max-h-[85vh] flex flex-col items-center">
              <img
                src={play.photos[selectedPhotoIndex].url}
                alt={play.photos[selectedPhotoIndex].caption || '확대 사진'}
                referrerPolicy="no-referrer"
                onError={applyImageFallback}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
              />
              {play.photos[selectedPhotoIndex].caption && (
                <p className="text-xs text-stone-200 mt-2 text-center bg-black/50 px-3 py-1 rounded-full">
                  {play.photos[selectedPhotoIndex].caption}
                </p>
              )}
              <button
                id="photo-lightbox-close-btn"
                ref={lightboxCloseRef}
                type="button"
                aria-label="확대 사진 닫기"
                onClick={closePhoto}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
