import type React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Save,
  HelpCircle,
  Tag,
  AlertCircle,
  Calendar,
  Camera
} from 'lucide-react';
import type { UserGame, SeedGame, GameOwnershipStatus, GameCondition } from '../types';
import { SEED_GAMES } from '../data/seedGames';
import { fetchScanAvailable } from '../services/gameScanner';
import { formatDate } from '../utils/formatters';
import { applyImageFallback } from '../utils/imageFallback';

interface GameFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gameData: Omit<UserGame, 'id' | 'createdAt' | 'updatedAt'>, source: { fromSeed: boolean }) => Promise<void>;
  initialGame?: UserGame | null;
  defaultSearchQuery?: string;
  onOpenScan?: () => void;
  /** Opens the photo picker without calling recognition. Used when no scan key is configured. */
  onPickPhoto?: () => void;
}

const OWNERSHIP_OPTIONS: GameOwnershipStatus[] = ['보유중', '빌려줌', '빌림', '판매예정', '판매완료', '분실', '처분'];

const CONDITION_OPTIONS: GameCondition[] = ['최상', '상', '중', '하', '미개봉'];

const GENRE_PRESETS = [
  '전략',
  '엔진빌딩',
  '일꾼배치',
  '타일배치',
  '덱빌딩',
  '추상전략',
  '파티',
  '블러핑',
  '추리',
  '마피아',
  '주사위',
  '협력',
  '가족',
  '2인전용',
  '경제',
  '셋컬렉션',
  '순발력'
];

export const GameFormModal: React.FC<GameFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialGame,
  defaultSearchQuery = '',
  onOpenScan,
  onPickPhoto
}) => {
  // Search state (when adding a new game)
  const [searchQuery, setSearchQuery] = useState(defaultSearchQuery);
  const [selectedSeed, setSelectedSeed] = useState<SeedGame | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [minPlayers, setMinPlayers] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [bestPlayers, setBestPlayers] = useState('');
  const [recommendedAge, setRecommendedAge] = useState(8);
  const [playTime, setPlayTime] = useState(30);
  const [weight, setWeight] = useState(2.0);
  const [publisher, setPublisher] = useState('');

  // Ownership & Condition
  const [ownershipStatus, setOwnershipStatus] = useState<GameOwnershipStatus>('보유중');
  const [condition, setCondition] = useState<GameCondition>('최상');
  const [storageLocation, setStorageLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [playCount, setPlayCount] = useState(0);

  // Price & Metas
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [marketPrice, setMarketPrice] = useState<number | ''>('');
  const [purchaseDate, setPurchaseDate] = useState(formatDate());
  const [priceSource, setPriceSource] = useState('사용자 수동 입력');

  // UI accordion for optional deep details
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [scanAvailability, setScanAvailability] = useState<'unknown' | 'on' | 'off'>('unknown');

  // Initialize or reset form
  // biome-ignore lint/correctness/useExhaustiveDependencies: `isOpen` is a trigger so reopening the modal re-initializes the form; the body does not read it
  useEffect(() => {
    if (initialGame) {
      setTitle(initialGame.title || '');
      setTitleEn(initialGame.titleEn || '');
      setImageUrl(initialGame.imageUrl || '');
      setGenres(initialGame.genre || []);
      setMinPlayers(initialGame.minPlayers || 2);
      setMaxPlayers(initialGame.maxPlayers || 4);
      setBestPlayers(initialGame.bestPlayers || '');
      setRecommendedAge(initialGame.recommendedAge || 8);
      setPlayTime(initialGame.playTime || 30);
      setWeight(initialGame.weight || 2.0);
      setPublisher(initialGame.publisher || '');
      setOwnershipStatus(initialGame.ownershipStatus || '보유중');
      setCondition(initialGame.condition || '최상');
      setStorageLocation(initialGame.storageLocation || '');
      setNotes(initialGame.notes || '');
      setPlayCount(initialGame.playCount || 0);
      setPurchasePrice(initialGame.purchasePrice || '');
      setOriginalPrice(initialGame.originalPrice || '');
      setMarketPrice(initialGame.marketPrice || '');
      setPurchaseDate(initialGame.purchaseDate || formatDate());
      setPriceSource(initialGame.priceMeta?.source || '사용자 수동 입력');
      setSelectedSeed(null);
    } else {
      // Reset
      setTitle('');
      setTitleEn('');
      setImageUrl('');
      setGenres(['전략']);
      setMinPlayers(2);
      setMaxPlayers(4);
      setBestPlayers('');
      setRecommendedAge(8);
      setPlayTime(30);
      setWeight(2.0);
      setPublisher('');
      setOwnershipStatus('보유중');
      setCondition('최상');
      setStorageLocation('');
      setNotes('');
      setPlayCount(0);
      setPurchasePrice('');
      setOriginalPrice('');
      setMarketPrice('');
      setPurchaseDate(formatDate());
      setPriceSource('사용자 수동 입력');
      setSearchQuery(defaultSearchQuery);
      setSelectedSeed(null);
    }
    setFormError(null);
  }, [initialGame, defaultSearchQuery, isOpen]);

  // Seed search matching
  const filteredSeeds = searchQuery.trim()
    ? SEED_GAMES.filter((g) => {
        const q = searchQuery.toLowerCase();
        return (
          g.title.toLowerCase().includes(q) ||
          g.titleEn.toLowerCase().includes(q) ||
          g.genre.some((tag) => tag.toLowerCase().includes(q))
        );
      })
    : [];

  const handleSelectSeed = (seed: SeedGame) => {
    setSelectedSeed(seed);
    setTitle(seed.title);
    setTitleEn(seed.titleEn);
    setImageUrl(seed.imageUrl);
    setGenres([...seed.genre]);
    setMinPlayers(seed.minPlayers);
    setMaxPlayers(seed.maxPlayers);
    setBestPlayers(seed.bestPlayers);
    setRecommendedAge(seed.recommendedAge);
    setPlayTime(seed.playTime);
    setWeight(seed.weight);
    setPublisher(seed.publisher);
    if (seed.description) {
      setNotes(seed.description);
    }
  };

  const toggleGenre = (genreTag: string) => {
    if (genres.includes(genreTag)) {
      setGenres(genres.filter((g) => g !== genreTag));
    } else {
      setGenres([...genres, genreTag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('게임명을 입력해 주세요.');
      return;
    }
    if ((Number(minPlayers) || 1) > (Number(maxPlayers) || 1)) {
      setFormError('최소 인원이 최대 인원보다 큽니다.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await onSave(
        {
          title: title.trim(),
          titleEn: titleEn.trim(),
          imageUrl: imageUrl.trim(),
          genre: genres.length > 0 ? genres : ['기타'],
          minPlayers: Number(minPlayers) || 1,
          maxPlayers: Number(maxPlayers) || 4,
          bestPlayers: bestPlayers.trim() || `${minPlayers}~${maxPlayers}인`,
          recommendedAge: Number(recommendedAge) || 8,
          playTime: Number(playTime) || 30,
          weight: Number(weight) || 2.0,
          publisher: publisher.trim(),
          purchaseDate: purchaseDate || formatDate(),
          purchasePrice: Number(purchasePrice) || 0,
          originalPrice: Number(originalPrice) || 0,
          marketPrice: Number(marketPrice) || 0,
          storageLocation: storageLocation.trim(),
          condition,
          tags: genres,
          notes: notes.trim(),
          ownershipStatus,
          playCount: Number(playCount) || 0,
          priceMeta: {
            source: priceSource.trim() || '사용자 수동 입력',
            verifiedDate: formatDate(),
            isManual: true
          }
        },
        { fromSeed: selectedSeed !== null }
      );
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isOpen || initialGame) return;
    let cancelled = false;
    setScanAvailability('unknown');
    fetchScanAvailable().then((available) => {
      if (!cancelled) setScanAvailability(available ? 'on' : 'off');
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, initialGame]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="game-form-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          exit={{ opacity: 0, y: 8 }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#898B8D] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#898B8D] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#4834D4] text-white flex items-center justify-center font-bold">
                <Plus className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#1E272E]">
                  {initialGame ? '보드게임 정보 수정' : '새 보드게임 등록'}
                </h2>
                <p className="text-[11px] text-[#636E72]">내 컬렉션에 추가하고 플레이를 기록하세요</p>
              </div>
            </div>
            <button
              id="game-form-close-btn"
              type="button"
              aria-label="닫기"
              onClick={onClose}
              className="p-1.5 text-[#636E72] hover:text-[#1E272E] rounded-full hover:bg-[#F1F3F5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content with scroll */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {/* Bulk path: one photo of a shelf instead of filling this form per game.
                Hidden until the server says a key exists, so a 503 does not dead-end the form. */}
            {!initialGame && scanAvailability === 'on' && onOpenScan && (
              <button
                id="game-form-open-scan-btn"
                type="button"
                onClick={onOpenScan}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#E2B657] p-4 text-left text-[#1A1408] transition-colors hover:bg-[#C9A24A]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1A1408]/10">
                  <Camera className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold">사진으로 여러 개 한 번에 등록</span>
                  <span className="block text-[11px] text-[#1A1408]/80">
                    책장을 찍으면 박스 제목을 읽어 목록으로 만들어 줍니다
                  </span>
                </div>
              </button>
            )}
            {!initialGame && scanAvailability === 'off' && (
              <div
                id="game-form-scan-unavailable"
                className="w-full p-4 bg-[#F8F9FA] border border-[#898B8D] rounded-2xl text-left"
              >
                <p className="text-xs font-bold text-[#1E272E]">사진으로 여러 개 등록은 아직 준비 중이에요.</p>
                <p className="text-[11px] text-[#636E72] mt-1 leading-relaxed">
                  사진은 고를 수 있어요. 이름은 읽지 않고, 서버로 보내지 않습니다. 고른 뒤 직접 입력으로 등록하세요.
                </p>
                {onPickPhoto && (
                  <button
                    id="game-form-pick-photo-btn"
                    type="button"
                    onClick={onPickPhoto}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] font-bold text-[#1E272E] border border-[#898B8D] hover:border-[#4834D4]"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    사진 선택
                  </button>
                )}
              </div>
            )}

            {/* Step 1: Seed Search Quick Fill (Only for new game) */}
            {!initialGame && (
              <div className="rounded-2xl border border-[#E9ECEF] bg-[#F8F9FA] p-4">
                <label
                  htmlFor="seed-game-search-input"
                  className="block text-xs font-bold text-[#1E272E] mb-1.5 flex items-center gap-1.5"
                >
                  <span>시드 목록에서 찾기</span>
                </label>
                <div className="relative">
                  <Search
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#636E72]"
                    aria-hidden="true"
                  />
                  <input
                    id="seed-game-search-input"
                    type="text"
                    placeholder="예: 스플렌더, 카탄, 루미큐브, 윙스팬, 테라포밍 마스..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#898B8D] rounded-2xl text-xs text-[#1E272E] focus:outline-hidden focus:border-[#4834D4] transition-colors"
                  />
                </div>

                {/* Seed Search Autocomplete Results */}
                {searchQuery.trim() && (
                  <div className="mt-2 max-h-48 overflow-y-auto bg-white rounded-2xl border border-[#898B8D] divide-y divide-[#898B8D] shadow-sm">
                    {filteredSeeds.length > 0 ? (
                      filteredSeeds.map((seed) => (
                        <button
                          key={seed.id}
                          type="button"
                          onClick={() => handleSelectSeed(seed)}
                          className={`w-full p-2.5 flex items-center gap-3 text-left hover:bg-[#F1F3F5] transition-colors ${
                            selectedSeed?.id === seed.id ? 'bg-[#4834D4]/10 font-bold' : ''
                          }`}
                        >
                          <img
                            src={seed.imageUrl}
                            alt={seed.title}
                            referrerPolicy="no-referrer"
                            onError={applyImageFallback}
                            className="w-10 h-10 rounded-xl object-cover bg-stone-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-[#1E272E] truncate">{seed.title}</span>
                              <span className="text-[10px] text-[#636E72] truncate">{seed.titleEn}</span>
                            </div>
                            <p className="text-[10px] text-[#636E72] truncate">
                              {seed.genre.join(', ')} • {seed.minPlayers}~{seed.maxPlayers}인 • {seed.playTime}분
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-[#4834D4] shrink-0 bg-[#4834D4]/10 px-2.5 py-1 rounded-full">
                            선택
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-[#636E72]">
                        '{searchQuery}' 시드 결과가 없습니다.{' '}
                        <button
                          type="button"
                          onClick={() => setTitle(searchQuery)}
                          className="text-[#4834D4] font-bold underline ml-1"
                        >
                          직접 입력으로 등록
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error banner */}
            {formError && (
              <div className="p-3 bg-[#FEEBEC] border border-[#EB4D4B]/30 rounded-2xl text-[#EB4D4B] text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Main Required Fields */}
            <div className="space-y-4">
              {/* Game Title */}
              <div>
                <label htmlFor="game-input-title" className="block text-xs font-bold text-[#1E272E] mb-1">
                  게임명 (한글) <span className="text-[#EB4D4B]">*</span>
                </label>
                <input
                  id="game-input-title"
                  type="text"
                  required
                  placeholder="예: 스플렌더"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F1F3F5] border border-[#898B8D] rounded-2xl text-xs font-medium text-[#1E272E] focus:bg-white focus:outline-hidden focus:border-[#4834D4] transition-colors"
                />
              </div>

              {/* English Title & Publisher */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="game-input-title-en" className="block text-xs font-bold text-[#1E272E] mb-1">
                    영문명
                  </label>
                  <input
                    id="game-input-title-en"
                    type="text"
                    placeholder="예: Splendor"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F1F3F5] border border-[#898B8D] rounded-2xl text-xs text-[#1E272E] focus:bg-white focus:outline-hidden focus:border-[#4834D4] transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="game-input-publisher" className="block text-xs font-bold text-[#1E272E] mb-1">
                    제작사 / 유통사
                  </label>
                  <input
                    id="game-input-publisher"
                    type="text"
                    placeholder="예: 코리아보드게임즈"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F1F3F5] border border-[#898B8D] rounded-2xl text-xs text-[#1E272E] focus:bg-white focus:outline-hidden focus:border-[#4834D4] transition-colors"
                  />
                </div>
              </div>

              {/* Box Art Image URL */}
              <div>
                <label
                  htmlFor="game-input-image-url"
                  className="block text-xs font-bold text-[#1E272E] mb-1 flex items-center justify-between"
                >
                  <span>박스 아트 이미지 URL</span>
                  <span className="text-[10px] text-[#636E72] font-normal">웹 링크 또는 기본 이미지</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#636E72]" />
                    <input
                      id="game-input-image-url"
                      type="url"
                      placeholder="https://..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#F1F3F5] border border-[#898B8D] rounded-2xl text-xs text-[#1E272E] focus:bg-white focus:outline-hidden focus:border-[#4834D4] transition-colors"
                    />
                  </div>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="미리보기"
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-xl object-cover border border-[#898B8D] shrink-0"
                      onError={applyImageFallback}
                    />
                  )}
                </div>
              </div>

              {/* Ownership Status & Condition */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="game-select-ownership" className="block text-xs font-bold text-[#1E272E] mb-1">
                    보유 상태 <span className="text-[#EB4D4B]">*</span>
                  </label>
                  <select
                    id="game-select-ownership"
                    value={ownershipStatus}
                    onChange={(e) => setOwnershipStatus(e.target.value as GameOwnershipStatus)}
                    className="w-full px-3 py-2 bg-[#F1F3F5] border border-[#898B8D] rounded-2xl text-xs font-bold text-[#1E272E] focus:bg-white focus:outline-hidden focus:border-[#4834D4] transition-colors"
                  >
                    {OWNERSHIP_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="game-select-condition" className="block text-xs font-bold text-[#1E272E] mb-1">
                    구성품 상태
                  </label>
                  <select
                    id="game-select-condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as GameCondition)}
                    className="w-full px-3 py-2 bg-[#F1F3F5] border border-[#898B8D] rounded-2xl text-xs font-medium text-[#1E272E] focus:bg-white focus:outline-hidden focus:border-[#4834D4] transition-colors"
                  >
                    {CONDITION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Purchase Date & Storage Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#F8F9FA] rounded-2xl border border-[#898B8D]">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="game-input-purchase-date"
                      className="text-xs font-bold text-[#1E272E] flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#4834D4]" />
                      <span>구매 일시 (구매일자)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setPurchaseDate(formatDate())}
                      className="text-[10px] text-[#4834D4] hover:underline font-bold"
                    >
                      오늘
                    </button>
                  </div>
                  <input
                    id="game-input-purchase-date"
                    type="text"
                    placeholder="YYYY.MM.DD"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#898B8D] rounded-2xl text-xs font-bold text-[#1E272E] focus:outline-hidden focus:border-[#4834D4] transition-colors"
                  />
                  {/* Quick date presets */}
                  <div className="flex items-center gap-1 mt-1.5 overflow-x-auto pb-0.5">
                    <button
                      type="button"
                      onClick={() => setPurchaseDate(formatDate())}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-white border border-[#898B8D] hover:bg-[#F1F3F5] text-[#636E72] font-bold shrink-0"
                    >
                      오늘 ({formatDate()})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setMonth(d.getMonth() - 1);
                        const ym = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
                        setPurchaseDate(ym);
                      }}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-white border border-[#898B8D] hover:bg-[#F1F3F5] text-[#636E72] font-medium shrink-0"
                    >
                      1달 전
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setFullYear(d.getFullYear() - 1);
                        const ym = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
                        setPurchaseDate(ym);
                      }}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-white border border-[#898B8D] hover:bg-[#F1F3F5] text-[#636E72] font-medium shrink-0"
                    >
                      1년 전
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="game-input-storage-location" className="block text-xs font-bold text-[#1E272E] mb-1">
                    보관 장소 (선택)
                  </label>
                  <input
                    id="game-input-storage-location"
                    type="text"
                    placeholder="예: 거실 수납장 1열, 서재 책장"
                    value={storageLocation}
                    onChange={(e) => setStorageLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#898B8D] rounded-2xl text-xs text-[#1E272E] focus:outline-hidden focus:border-[#4834D4] transition-colors"
                  />
                  <p className="text-[10px] text-[#636E72] mt-1.5">어디에 보관되어 있는지 메모해두세요</p>
                </div>
              </div>

              {/* Genre tag chips */}
              <fieldset className="border-0 p-0 m-0 min-w-0">
                <legend className="block text-xs font-bold text-[#1E272E] mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#636E72]" />
                  <span>장르 선택 (다중 선택 가능)</span>
                </legend>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-[#F1F3F5] rounded-2xl border border-[#898B8D]">
                  {GENRE_PRESETS.map((g) => {
                    const isSelected = genres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => toggleGenre(g)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                          isSelected
                            ? 'bg-[#4834D4] text-white shadow-xs'
                            : 'bg-white text-[#636E72] hover:bg-[#E9ECEF] border border-[#898B8D]'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Players, Time, Weight */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="game-input-min-players" className="block text-[11px] font-bold text-[#1E272E] mb-1">
                    최소 인원
                  </label>
                  <input
                    id="game-input-min-players"
                    type="number"
                    min="1"
                    max="30"
                    value={minPlayers}
                    onChange={(e) => setMinPlayers(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-[#F1F3F5] border border-[#898B8D] rounded-2xl text-xs font-bold text-center focus:bg-white focus:outline-hidden focus:border-[#4834D4]"
                  />
                </div>
                <div>
                  <label htmlFor="game-input-max-players" className="block text-[11px] font-bold text-[#1E272E] mb-1">
                    최대 인원
                  </label>
                  <input
                    id="game-input-max-players"
                    type="number"
                    min="1"
                    max="30"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-[#F1F3F5] border border-[#898B8D] rounded-2xl text-xs font-bold text-center focus:bg-white focus:outline-hidden focus:border-[#4834D4]"
                  />
                </div>
                <div>
                  <label htmlFor="game-input-playtime" className="block text-[11px] font-bold text-[#1E272E] mb-1">
                    플레이타임(분)
                  </label>
                  <input
                    id="game-input-playtime"
                    type="number"
                    step="5"
                    min="5"
                    value={playTime}
                    onChange={(e) => setPlayTime(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-[#F1F3F5] border border-[#898B8D] rounded-2xl text-xs font-bold text-center focus:bg-white focus:outline-hidden focus:border-[#4834D4]"
                  />
                </div>
              </div>
            </div>

            {/* Advanced & Price Details Accordion */}
            <div className="border-t border-[#898B8D] pt-3">
              <button
                type="button"
                aria-expanded={showAdvanced}
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between py-2 text-xs font-bold text-[#1E272E] hover:text-[#4834D4] transition-colors"
              >
                <span>상세 정보 & 구매 가격 입력 (선택)</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="space-y-4 pt-3 mt-1 bg-[#F8F9FA] p-4 rounded-2xl border border-[#898B8D] text-xs">
                  {/* Difficulty / Weight & Best Players */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="game-input-weight" className="block text-[11px] font-bold text-[#1E272E] mb-1">
                        난이도 (1.0 ~ 5.0)
                      </label>
                      <input
                        id="game-input-weight"
                        type="number"
                        step="0.1"
                        min="1.0"
                        max="5.0"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-[#898B8D] rounded-2xl text-xs text-[#1E272E]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="game-input-best-players"
                        className="block text-[11px] font-bold text-[#1E272E] mb-1"
                      >
                        권장 인원
                      </label>
                      <input
                        id="game-input-best-players"
                        type="text"
                        placeholder="예: 3인, 4인"
                        value={bestPlayers}
                        onChange={(e) => setBestPlayers(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#898B8D] rounded-2xl text-xs text-[#1E272E]"
                      />
                    </div>
                  </div>

                  {/* Price info (manual entry disclaimer) */}
                  <div className="p-4 bg-white rounded-2xl border border-[#898B8D] space-y-2 shadow-sm">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1E272E]">
                      <HelpCircle className="w-3.5 h-3.5 text-[#4834D4]" />
                      <span>가격 데이터 정직성 안내</span>
                    </div>
                    <p className="text-[10px] text-[#636E72] leading-relaxed">
                      보드로그의 모든 가격 정보는 사용자가 직접 수동 입력하며, 실시간 시세가 아닌 기록 당시의
                      정보입니다.
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <label
                          htmlFor="game-input-purchase-price"
                          className="block text-[10px] font-bold text-[#1E272E] mb-1"
                        >
                          구매가 (₩)
                        </label>
                        <input
                          id="game-input-purchase-price"
                          type="number"
                          placeholder="0"
                          value={purchasePrice}
                          onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-[#F1F3F5] border border-[#898B8D] rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="game-input-original-price"
                          className="block text-[10px] font-bold text-[#1E272E] mb-1"
                        >
                          정가 (₩)
                        </label>
                        <input
                          id="game-input-original-price"
                          type="number"
                          placeholder="0"
                          value={originalPrice}
                          onChange={(e) => setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-[#F1F3F5] border border-[#898B8D] rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="game-input-market-price"
                          className="block text-[10px] font-bold text-[#1E272E] mb-1"
                        >
                          중고 시세 (₩)
                        </label>
                        <input
                          id="game-input-market-price"
                          type="number"
                          placeholder="0"
                          value={marketPrice}
                          onChange={(e) => setMarketPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-[#F1F3F5] border border-[#898B8D] rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="game-input-price-source"
                        className="block text-[10px] font-bold text-[#1E272E] mb-1"
                      >
                        가격 출처 / 확인일
                      </label>
                      <input
                        id="game-input-price-source"
                        type="text"
                        placeholder="예: 2026 보드게임 콘 현장 구매, 당근마켓"
                        value={priceSource}
                        onChange={(e) => setPriceSource(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#F1F3F5] border border-[#898B8D] rounded-xl text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="game-input-notes" className="block text-[11px] font-bold text-[#1E272E] mb-1">
                      메모 / 특이사항
                    </label>
                    <textarea
                      id="game-input-notes"
                      rows={2}
                      placeholder="프로텍터 슬리브 사이즈, 슬리브 여부, 확장팩 포함 여부 등"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#898B8D] rounded-2xl text-xs text-[#1E272E]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="p-4 border-t border-[#898B8D] bg-white flex items-center justify-end gap-2">
            <button
              id="game-form-cancel-btn"
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-5 py-3 text-xs font-bold text-[#636E72] hover:bg-[#F1F3F5] rounded-full transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              id="game-form-save-btn"
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#4834D4] hover:bg-[#3c2ab9] active:bg-[#3c2ab9] text-white text-xs font-bold rounded-full transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? '저장 중...' : initialGame ? '수정 완료' : '내 게임에 등록'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
