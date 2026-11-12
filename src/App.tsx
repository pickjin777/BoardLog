import type React from 'react';
import { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, LayoutGrid, List, Download, MessageCircle } from 'lucide-react';
import type { UserGame, PlayRecord, GameOwnershipStatus, MyGameResult, TabType } from './types';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { track } from './services/analytics';
import { topOverlay, type OverlayName } from './utils/overlayHistory';
import { storage } from './services/storage';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeDashboard } from './components/HomeDashboard';
import { GameCard } from './components/GameCard';
import { GameListItem } from './components/GameListItem';
import { GameFormModal } from './components/GameFormModal';
import { GameScanModal } from './components/GameScanModal';
import { GameDetailModal } from './components/GameDetailModal';
import { GameCatalogModal } from './components/GameCatalogModal';
import { KakaoShareModal } from './components/KakaoShareModal';
import { PlayCard } from './components/PlayCard';
import { PlayRecordFormModal } from './components/PlayRecordFormModal';
import { PlayDetailModal } from './components/PlayDetailModal';
import { MyPageView } from './components/MyPageView';
import { AuthModal } from './components/AuthModal';
import { PlayShareSheet } from './components/PlayShareSheet';
import { SharedPlayModal } from './components/SharedPlayModal';
import { type SharedPlay, decodeSharedPlay, sharedHashPresent, toRecipientRecord } from './utils/sharedPlay';
import { normalizePlay } from './utils/backupImport';
import { ConfirmModal } from './components/ConfirmModal';
import { LocalStorageNotice } from './components/LocalStorageNotice';
import { LoadingState, EmptyState, ErrorState } from './components/StateViews';
import { TreasureReveal, type TreasureMoment } from './components/TreasureReveal';
import { dayHeading } from './utils/memoryCard';

const PlayCalendar = lazy(() => import('./components/PlayCalendar').then((mod) => ({ default: mod.PlayCalendar })));

const OWNERSHIP_TABS: (GameOwnershipStatus | '전체')[] = [
  '전체',
  '보유중',
  '빌려줌',
  '빌림',
  '판매예정',
  '판매완료',
  '분실',
  '처분'
];

const PLAY_RESULT_TABS: (MyGameResult | '전체')[] = ['전체', '승리', '패배', '무승부'];

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Main Data States
  const [games, setGames] = useState<UserGame[]>([]);
  const [plays, setPlays] = useState<PlayRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search & Filter States for Games tab
  const [gameSearch, setGameSearch] = useState('');
  const [selectedOwnership, setSelectedOwnership] = useState<GameOwnershipStatus | '전체'>('전체');
  const [gameViewMode, setGameViewMode] = useState<'grid' | 'list'>('grid');

  // Search & Filter States for Plays tab
  const [playSearch, setPlaySearch] = useState('');
  const [selectedPlayResult, setSelectedPlayResult] = useState<MyGameResult | '전체'>('전체');
  const [selectedPlayDate, setSelectedPlayDate] = useState<string | null>(null);

  // Modals Management
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isKakaoShareOpen, setIsKakaoShareOpen] = useState(false);
  const [isGameFormOpen, setIsGameFormOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanAllowsRecognition, setScanAllowsRecognition] = useState(true);
  const [editingGame, setEditingGame] = useState<UserGame | null>(null);
  const [viewingGame, setViewingGame] = useState<UserGame | null>(null);

  const [isPlayFormOpen, setIsPlayFormOpen] = useState(false);
  const [editingPlay, setEditingPlay] = useState<PlayRecord | null>(null);
  const [sharingPlay, setSharingPlay] = useState<PlayRecord | null>(null);
  const [incomingShare, setIncomingShare] = useState<SharedPlay | null>(null);
  const [viewingPlay, setViewingPlay] = useState<PlayRecord | null>(null);
  const [preselectedGameForPlay, setPreselectedGameForPlay] = useState<UserGame | null>(null);

  // Confirm delete modals
  const [deletingGame, setDeletingGame] = useState<UserGame | null>(null);
  const [deletingPlay, setDeletingPlay] = useState<PlayRecord | null>(null);
  const [treasure, setTreasure] = useState<TreasureMoment | null>('enter');

  const overlay = topOverlay({
    treasure: treasure !== null,
    auth: isAuthOpen,
    catalog: isCatalogModalOpen,
    kakao: isKakaoShareOpen,
    incoming: incomingShare !== null,
    share: sharingPlay !== null,
    game: viewingGame !== null,
    play: viewingPlay !== null,
    playForm: isPlayFormOpen,
    gameForm: isGameFormOpen,
    scan: isScanOpen,
    deleteGame: deletingGame !== null,
    deletePlay: deletingPlay !== null
  });
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;
  const pushedOverlay = useRef(false);

  const closeOverlay = useCallback((name: OverlayName) => {
    if (name === 'treasure') setTreasure(null);
    else if (name === 'auth') setIsAuthOpen(false);
    else if (name === 'catalog') setIsCatalogModalOpen(false);
    else if (name === 'kakao') setIsKakaoShareOpen(false);
    else if (name === 'incoming') setIncomingShare(null);
    else if (name === 'share') setSharingPlay(null);
    else if (name === 'game') setViewingGame(null);
    else if (name === 'play') setViewingPlay(null);
    else if (name === 'playForm') {
      setIsPlayFormOpen(false);
      setEditingPlay(null);
    } else if (name === 'gameForm') {
      setIsGameFormOpen(false);
      setEditingGame(null);
    } else if (name === 'scan') setIsScanOpen(false);
    else if (name === 'deleteGame') setDeletingGame(null);
    else setDeletingPlay(null);
  }, []);

  useEffect(() => {
    if (!overlay) {
      if (pushedOverlay.current) {
        pushedOverlay.current = false;
        history.back();
      }
      return;
    }
    if (!pushedOverlay.current) {
      history.pushState({ boardlogOverlay: overlay }, '');
      pushedOverlay.current = true;
    }
    const onPop = () => {
      pushedOverlay.current = false;
      const current = overlayRef.current;
      if (current) closeOverlay(current);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [overlay, closeOverlay]);

  // Fetch all user data
  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [fetchedGames, fetchedPlays] = await Promise.all([
        storage.getUserGames(user.uid),
        storage.getPlayRecords(user.uid)
      ]);
      setGames(fetchedGames);
      setPlays(fetchedPlays);
    } catch {
      setLoadError('데이터를 불러오는 중 오류가 발생했습니다.');
      showToast('데이터 불러오기 실패', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Handlers: Game CRUD ---
  const handleSaveGame = async (
    gameData: Omit<UserGame, 'id' | 'createdAt' | 'updatedAt'>,
    source: { fromSeed: boolean }
  ) => {
    if (!user) return;
    if (editingGame) {
      // Update
      const updated = await storage.updateUserGame(user.uid, editingGame.id, gameData);
      if (updated) {
        setGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        if (viewingGame?.id === updated.id) {
          setViewingGame(updated);
        }
        showToast(`'${updated.title}' 정보가 수정되었습니다.`, 'success');
      }
    } else {
      // Create
      const newGame = await storage.addUserGame(user.uid, gameData);
      track('game_added', { method: source.fromSeed ? 'seed' : 'manual' });
      setGames((prev) => [newGame, ...prev]);
      setTreasure('acquire');
      showToast(`'${newGame.title}'이(가) 내 게임에 추가되었습니다!`, 'success');
    }
    setEditingGame(null);
    setIsGameFormOpen(false);
  };

  const handleRegisterScannedGames = async (scanned: Omit<UserGame, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    if (!user) return;
    const created: UserGame[] = [];
    try {
      for (const game of scanned) {
        created.push(await storage.addUserGame(user.uid, game));
        track('game_added', { method: 'scan' });
      }
    } finally {
      // Whatever was written before a failure is already saved, so reflect it either way.
      if (created.length > 0) {
        setGames((prev) => [...[...created].reverse(), ...prev]);
        setTreasure('acquire');
      }
    }
    showToast(`${created.length}개 게임이 등록되었습니다.`, 'success');
  };

  const handleConfirmDeleteGame = async () => {
    if (!user || !deletingGame) return;
    try {
      const ok = await storage.deleteUserGame(user.uid, deletingGame.id);
      if (ok) {
        setGames((prev) => prev.filter((g) => g.id !== deletingGame.id));
        if (viewingGame?.id === deletingGame.id) {
          setViewingGame(null);
        }
        showToast(`'${deletingGame.title}'이(가) 삭제되었습니다.`, 'info');
      }
    } catch {
      showToast('삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setDeletingGame(null);
    }
  };

  // A shared play arrives in the URL hash. Clear it right away so a reload does not reopen it
  // and the friends' names do not linger in the address bar or history.
  // Also on hashchange: opening a second link while the app is already open only changes the
  // fragment, which does not reload the page.
  useEffect(() => {
    const readSharedHash = () => {
      const { hash, pathname, search } = window.location;
      if (!sharedHashPresent(hash)) return;
      window.history.replaceState(null, '', pathname + search);
      const shared = decodeSharedPlay(hash);
      if (shared) {
        track('share_link_opened');
        setIncomingShare(shared);
      } else {
        showToast('공유 링크가 손상되어 기록을 열 수 없습니다.', 'error');
      }
    };
    readSharedHash();
    window.addEventListener('hashchange', readSharedHash);
    return () => window.removeEventListener('hashchange', readSharedHash);
  }, [showToast]);

  const handleAddSharedPlay = async (myIndex: number) => {
    if (!user || !incomingShare) return;
    const imported = normalizePlay(toRecipientRecord(incomingShare, myIndex));
    if (!imported) {
      showToast('공유된 기록을 읽지 못했습니다.', 'error');
      return;
    }
    try {
      // Same path as backup restore: fresh id, whitelisted fields, duplicate check, ownership.
      const plan = await storage.planImport(user.uid, { games: [], plays: [imported], invalidCount: 0 });
      if (plan.newPlays.length === 0) {
        showToast('이미 내 기록에 있는 게임이에요.', 'info');
      } else {
        await storage.commitImport(user.uid, plan);
        track('share_link_added');
        await loadData();
        showToast('내 기록에 추가했어요.', 'success');
      }
      setIncomingShare(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '기록을 추가하지 못했습니다.', 'error');
    }
  };

  const handleRemoveSampleData = async () => {
    if (!user) return;
    try {
      const removed = await storage.removeSampleData(user.uid);
      await loadData();
      showToast(`예시 기록 ${removed.plays}개, 예시 게임 ${removed.games}개를 지웠습니다.`, 'success');
    } catch {
      showToast('예시 데이터를 지우지 못했습니다.', 'error');
    }
  };

  // --- Handlers: Play Record CRUD ---
  const handleSavePlay = async (playData: Omit<PlayRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    setSelectedPlayDate(null);
    if (editingPlay) {
      // Update
      const updated = await storage.updatePlayRecord(user.uid, editingPlay.id, playData);
      if (updated) {
        setPlays((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        if (viewingPlay?.id === updated.id) {
          setViewingPlay(updated);
        }
        // Refresh games play counts
        const updatedGames = await storage.getUserGames(user.uid);
        setGames(updatedGames);
        showToast('플레이 기록이 수정되었습니다.', 'success');
      }
    } else {
      // Create
      const newPlay = await storage.addPlayRecord(user.uid, playData);
      track('play_saved');
      if (playData.photos.length > 0) track('play_photo_added', { count: playData.photos.length });
      setPlays((prev) => [newPlay, ...prev]);
      // Refresh games to update playCount
      const updatedGames = await storage.getUserGames(user.uid);
      setGames(updatedGames);
      showToast('플레이 기록을 저장했습니다', 'success');
      track('share_sheet_opened');
      setSharingPlay(newPlay);
    }
    setEditingPlay(null);
    setIsPlayFormOpen(false);
    setPreselectedGameForPlay(null);
  };

  const handleConfirmDeletePlay = async () => {
    if (!user || !deletingPlay) return;
    try {
      const ok = await storage.deletePlayRecord(user.uid, deletingPlay.id);
      if (ok) {
        setPlays((prev) => prev.filter((p) => p.id !== deletingPlay.id));
        if (viewingPlay?.id === deletingPlay.id) {
          setViewingPlay(null);
        }
        const updatedGames = await storage.getUserGames(user.uid);
        setGames(updatedGames);
        showToast('플레이 기록이 삭제되었습니다.', 'info');
      }
    } catch {
      showToast('기록 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setDeletingPlay(null);
    }
  };

  // Quick Action from Game Card/Detail
  const handleStartPlayForGame = (game: UserGame) => {
    setPreselectedGameForPlay(game);
    setEditingPlay(null);
    setViewingGame(null);
    setIsPlayFormOpen(true);
  };

  // Filtered Games
  const filteredGames = games.filter((g) => {
    const matchesSearch =
      !gameSearch.trim() ||
      g.title.toLowerCase().includes(gameSearch.toLowerCase()) ||
      g.titleEn.toLowerCase().includes(gameSearch.toLowerCase()) ||
      g.publisher.toLowerCase().includes(gameSearch.toLowerCase()) ||
      g.genre.some((tag) => tag.toLowerCase().includes(gameSearch.toLowerCase())) ||
      g.storageLocation.toLowerCase().includes(gameSearch.toLowerCase());

    const matchesOwnership = selectedOwnership === '전체' || g.ownershipStatus === selectedOwnership;

    return matchesSearch && matchesOwnership;
  });

  // Filtered Plays
  const filteredPlays = plays.filter((p) => {
    const matchesSearch =
      !playSearch.trim() ||
      p.gameTitle.toLowerCase().includes(playSearch.toLowerCase()) ||
      p.location.toLowerCase().includes(playSearch.toLowerCase()) ||
      p.participants.some((part) => part.name.toLowerCase().includes(playSearch.toLowerCase()));

    const matchesResult = selectedPlayResult === '전체' || p.myResult === selectedPlayResult;
    const matchesDate = selectedPlayDate === null || p.date === selectedPlayDate;

    return matchesSearch && matchesResult && matchesDate;
  });

  return (
    <div className="treasure-shell min-h-screen bg-[#F1F3F5] text-[#2D3436] flex flex-col font-sans selection:bg-[#4834D4]/20 selection:text-[#4834D4] lg:pl-60">
      {treasure && <TreasureReveal kind={treasure} onDone={() => setTreasure(null)} />}
      {/* Top Fixed Header */}
      <Navbar onOpenAuth={() => setIsAuthOpen(true)} />

      {/* Phone stays a single column. Tablet and desktop use the extra width. */}
      <main
        id="app-shell-main"
        className="flex-1 w-full min-w-0 max-w-xl md:max-w-3xl lg:max-w-6xl mx-auto px-4 md:px-6 pt-4 lg:pb-12"
      >
        <LocalStorageNotice
          onBackup={() => {
            setActiveTab('mypage');
            window.setTimeout(() => {
              document.getElementById('export-json-btn')?.scrollIntoView({ block: 'center' });
            }, 50);
          }}
        />
        {isLoading ? (
          <LoadingState message="보드로그 데이터를 불러오는 중입니다..." />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={loadData} />
        ) : (
          <>
            {/* 1. HOME TAB */}
            {activeTab === 'home' && (
              <HomeDashboard
                games={games}
                plays={plays}
                onRemoveSampleData={handleRemoveSampleData}
                onOpenAddPlay={() => {
                  setEditingPlay(null);
                  setPreselectedGameForPlay(null);
                  setIsPlayFormOpen(true);
                }}
                onOpenAddGame={() => {
                  setEditingGame(null);
                  setIsGameFormOpen(true);
                }}
                onOpenCatalog={() => setIsCatalogModalOpen(true)}
                onOpenKakaoShare={() => setIsKakaoShareOpen(true)}
                onSelectGame={(game) => setViewingGame(game)}
                onSelectPlay={(play) => setViewingPlay(play)}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {/* 2. GAMES TAB (내 보드게임) */}
            {activeTab === 'games' && (
              <div className="space-y-4 pb-6">
                {/* Title stays full width. At 320px a side-by-side row crushed it into "내 보드게 / 임". */}
                <div className="space-y-3">
                  <div>
                    <h2 id="games-tab-title" className="text-xl font-black text-[#1E272E]">
                      내 보드게임 컬렉션
                    </h2>
                    <p className="text-xs text-[#636E72]">총 {games.length}개의 게임</p>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&>button]:shrink-0">
                    {/* Add Game Button */}
                    <button
                      id="games-add-game-btn"
                      type="button"
                      onClick={() => {
                        setEditingGame(null);
                        setIsGameFormOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4834D4] hover:bg-[#3c2ab9] text-white rounded-2xl text-xs font-bold transition-colors"
                      title="새 보드게임 추가하기"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>게임 추가</span>
                    </button>

                    {/* KakaoTalk Share Button */}
                    <button
                      id="games-kakao-share-btn"
                      type="button"
                      onClick={() => setIsKakaoShareOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FEE500] hover:bg-[#F5DC00] active:bg-[#E8CE00] text-[#191919] rounded-2xl text-xs font-black shadow-xs transition-colors border border-[#F5DC00]"
                      title="소장 보드게임 목록 카카오톡 공유 (전체 / 4인이하 등 조건 선택)"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-[#191919]" />
                      <span className="hidden sm:inline">카카오톡 공유</span>
                      <span className="sm:hidden">카톡 공유</span>
                    </button>

                    {/* Catalog Print & PDF Export Button */}
                    <button
                      id="games-print-catalog-btn"
                      type="button"
                      onClick={() => setIsCatalogModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F8F9FA] text-[#1E272E] rounded-2xl text-xs font-bold border border-[#E9ECEF] shadow-sm transition-colors"
                      title="소장 도록 PDF 저장 및 인쇄"
                    >
                      <Download className="w-3.5 h-3.5 text-[#4834D4]" />
                      <span className="hidden sm:inline">PDF 도록 / 인쇄</span>
                      <span className="sm:hidden">PDF</span>
                    </button>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#E9ECEF] shadow-sm">
                      <button
                        type="button"
                        onClick={() => setGameViewMode('grid')}
                        className={`p-2 rounded-xl transition-colors ${
                          gameViewMode === 'grid'
                            ? 'bg-[#4834D4] text-white shadow-xs'
                            : 'text-[#636E72] hover:text-[#2D3436]'
                        }`}
                        aria-label="격자 보기"
                        aria-pressed={gameViewMode === 'grid'}
                        title="격자 보기"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setGameViewMode('list')}
                        className={`p-2 rounded-xl transition-colors ${
                          gameViewMode === 'list'
                            ? 'bg-[#4834D4] text-white shadow-xs'
                            : 'text-[#636E72] hover:text-[#2D3436]'
                        }`}
                        aria-label="목록 보기"
                        aria-pressed={gameViewMode === 'list'}
                        title="목록 보기"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search
                    className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#636E72]"
                    aria-hidden="true"
                  />
                  <input
                    id="games-search-input"
                    type="text"
                    aria-label="게임 검색"
                    placeholder="게임, 장르, 보관 장소"
                    value={gameSearch}
                    onChange={(e) => setGameSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E9ECEF] rounded-full text-xs text-[#1E272E] focus:outline-hidden focus:ring-2 focus:ring-[#4834D4]/20 focus:border-[#4834D4] shadow-sm transition-colors"
                  />
                </div>

                {/* Ownership Filter Pills */}
                <div id="games-ownership-filters" className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {OWNERSHIP_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSelectedOwnership(tab)}
                      aria-pressed={selectedOwnership === tab}
                      className={`shrink-0 px-4 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors ${
                        selectedOwnership === tab
                          ? 'bg-[#4834D4] text-white shadow-xs'
                          : 'bg-white text-[#636E72] border border-[#E9ECEF] hover:bg-[#F8F9FA]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Game List / Grid */}
                {filteredGames.length > 0 ? (
                  gameViewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredGames.map((game) => (
                        <GameCard
                          key={game.id}
                          game={game}
                          onClick={() => setViewingGame(game)}
                          onDelete={(e) => {
                            e.stopPropagation();
                            setDeletingGame(game);
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredGames.map((game) => (
                        <GameListItem
                          key={game.id}
                          game={game}
                          onClick={() => setViewingGame(game)}
                          onDelete={(e) => {
                            e.stopPropagation();
                            setDeletingGame(game);
                          }}
                        />
                      ))}
                    </div>
                  )
                ) : games.length === 0 ? (
                  <EmptyState
                    title="등록된 게임이 없습니다"
                    description="게임을 등록하면 플레이를 이 기록에 묶을 수 있습니다."
                    actionText="게임 추가"
                    onAction={() => {
                      setEditingGame(null);
                      setIsGameFormOpen(true);
                    }}
                  />
                ) : (
                  <div className="p-8 bg-white rounded-2xl border border-[#E9ECEF] text-center space-y-3 shadow-sm">
                    <p className="text-xs text-[#636E72]">'{gameSearch}' 검색 조건에 맞는 게임이 없습니다.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGame(null);
                        setIsGameFormOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4834D4] hover:bg-[#3c2ab9] text-white text-xs font-bold rounded-full transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>'{gameSearch}' 직접 등록하기</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. PLAYS TAB (플레이 기록) */}
            {activeTab === 'plays' && (
              <div className="space-y-4 pb-20">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-xl font-black text-[#1E272E]">플레이 기록</h2>
                    <p className="text-xs text-[#636E72]">총 {plays.length}회의 플레이 기록</p>
                  </div>

                  <button
                    id="plays-tab-add-btn"
                    type="button"
                    onClick={() => {
                      setEditingPlay(null);
                      setPreselectedGameForPlay(null);
                      setIsPlayFormOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4834D4] hover:bg-[#3c2ab9] text-white rounded-full text-xs font-bold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>새 기록</span>
                  </button>
                </div>

                {plays.length > 0 && (
                  <Suspense
                    fallback={
                      <div
                        role="status"
                        className="rounded-3xl border border-[#C6A36A] bg-[#1C1812] px-4 py-6 text-sm text-[#F6EBD4]"
                      >
                        달력을 불러오는 중
                      </div>
                    }
                  >
                    <PlayCalendar
                      plays={plays}
                      selectedDate={selectedPlayDate}
                      onSelectDate={(dateKey) =>
                        setSelectedPlayDate((current) => (current === dateKey ? null : dateKey))
                      }
                    />
                  </Suspense>
                )}

                {selectedPlayDate && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#F6EBD4]">{dayHeading(selectedPlayDate)}의 추억 카드</p>
                    <button
                      id="plays-show-all-btn"
                      type="button"
                      onClick={() => setSelectedPlayDate(null)}
                      className="rounded-full bg-[#4834D4] px-4 text-sm font-bold text-white"
                    >
                      전체 기록
                    </button>
                  </div>
                )}

                {/* Search Bar */}
                <div className="relative">
                  <Search
                    className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#636E72]"
                    aria-hidden="true"
                  />
                  <input
                    id="plays-search-input"
                    type="text"
                    aria-label="플레이 기록 검색"
                    placeholder="게임, 참여자, 장소"
                    value={playSearch}
                    onChange={(e) => setPlaySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E9ECEF] rounded-full text-xs text-[#1E272E] focus:outline-hidden focus:ring-2 focus:ring-[#4834D4]/20 focus:border-[#4834D4] shadow-sm transition-colors"
                  />
                </div>

                {/* Result Filter Tabs */}
                <div id="plays-result-filters" className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {PLAY_RESULT_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSelectedPlayResult(tab)}
                      aria-pressed={selectedPlayResult === tab}
                      className={`shrink-0 px-4 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors ${
                        selectedPlayResult === tab
                          ? 'bg-[#4834D4] text-white shadow-xs'
                          : 'bg-white text-[#636E72] border border-[#E9ECEF] hover:bg-[#F8F9FA]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Plays List */}
                {filteredPlays.length > 0 ? (
                  <div id="memory-card-list" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPlays.map((play) => (
                      <PlayCard key={play.id} play={play} onClick={() => setViewingPlay(play)} />
                    ))}
                  </div>
                ) : plays.length === 0 ? (
                  <EmptyState
                    title="아직 플레이 기록이 없습니다"
                    description="참여자와 승자만 적어도 한 판이 남습니다."
                    actionText="첫 플레이 기록 남기기"
                    onAction={() => {
                      setEditingPlay(null);
                      setPreselectedGameForPlay(null);
                      setIsPlayFormOpen(true);
                    }}
                  />
                ) : (
                  <div
                    id="plays-filter-empty"
                    className="p-8 bg-white rounded-2xl border border-[#E9ECEF] text-center text-sm text-[#F6EBD4] shadow-sm"
                  >
                    {selectedPlayDate
                      ? `${dayHeading(selectedPlayDate)}의 조건에 맞는 기록이 없습니다.`
                      : `'${playSearch}' 조건에 해당하는 플레이 기록이 없습니다.`}
                  </div>
                )}
              </div>
            )}

            {/* 4. MY PAGE TAB */}
            {activeTab === 'mypage' && (
              <MyPageView
                onOpenAuth={() => setIsAuthOpen(true)}
                onOpenCatalog={() => setIsCatalogModalOpen(true)}
                onDataImported={loadData}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation & Big Central FAB */}
      <BottomNav
        currentTab={activeTab}
        onTabChange={setActiveTab}
        onQuickAddPlay={() => {
          setEditingPlay(null);
          setPreselectedGameForPlay(null);
          setIsPlayFormOpen(true);
        }}
      />

      {/* --- ALL MODALS --- */}
      {/* KakaoTalk Share Modal */}
      <KakaoShareModal
        isOpen={isKakaoShareOpen}
        games={games}
        ownerName={user?.nickname || '나'}
        onClose={() => setIsKakaoShareOpen(false)}
      />

      {/* Game Catalog & PDF Print Modal */}
      <GameCatalogModal
        isOpen={isCatalogModalOpen}
        games={games}
        ownerName={user?.nickname || '나'}
        onClose={() => setIsCatalogModalOpen(false)}
      />

      {/* Game Add/Edit Modal */}
      <GameFormModal
        isOpen={isGameFormOpen}
        initialGame={editingGame}
        defaultSearchQuery={gameSearch}
        onClose={() => {
          setIsGameFormOpen(false);
          setEditingGame(null);
        }}
        onSave={handleSaveGame}
        onOpenScan={() => {
          setScanAllowsRecognition(true);
          setIsGameFormOpen(false);
          setEditingGame(null);
          setIsScanOpen(true);
        }}
        onPickPhoto={() => {
          setScanAllowsRecognition(false);
          setIsGameFormOpen(false);
          setEditingGame(null);
          setIsScanOpen(true);
        }}
      />

      {/* Bulk Registration from Photos */}
      <GameScanModal
        isOpen={isScanOpen}
        allowRecognition={scanAllowsRecognition}
        onClose={() => setIsScanOpen(false)}
        onManualEntry={() => {
          setIsScanOpen(false);
          setEditingGame(null);
          setIsGameFormOpen(true);
        }}
        existingGames={games}
        onRegister={handleRegisterScannedGames}
      />

      {/* Game Details Modal */}
      <GameDetailModal
        isOpen={!!viewingGame}
        game={viewingGame}
        plays={plays}
        games={games}
        onOpenPlay={(play) => {
          setViewingGame(null);
          setViewingPlay(play);
        }}
        onClose={() => setViewingGame(null)}
        onEdit={(game) => {
          setViewingGame(null);
          setEditingGame(game);
          setIsGameFormOpen(true);
        }}
        onDelete={(game) => {
          setDeletingGame(game);
        }}
        onStartPlay={handleStartPlayForGame}
      />

      {/* Play Add/Edit Modal */}
      <PlayRecordFormModal
        isOpen={isPlayFormOpen}
        initialPlay={editingPlay}
        preselectedGame={preselectedGameForPlay}
        userGames={games}
        pastPlays={plays}
        onClose={() => {
          setIsPlayFormOpen(false);
          setEditingPlay(null);
          setPreselectedGameForPlay(null);
        }}
        onSave={handleSavePlay}
      />

      {/* Play Details Modal */}
      <PlayDetailModal
        isOpen={!!viewingPlay}
        play={viewingPlay}
        onClose={() => setViewingPlay(null)}
        onEdit={(play) => {
          setViewingPlay(null);
          setEditingPlay(play);
          setIsPlayFormOpen(true);
        }}
        onDelete={(play) => {
          setDeletingPlay(play);
        }}
      />

      <PlayShareSheet play={sharingPlay} onClose={() => setSharingPlay(null)} />
      <SharedPlayModal shared={incomingShare} onClose={() => setIncomingShare(null)} onAdd={handleAddSharedPlay} />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Delete Game Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingGame}
        title="보드게임 삭제"
        message={`'${deletingGame?.title}' 게임을 내 목록에서 삭제하시겠습니까? 기록된 플레이 내역은 유지됩니다.`}
        confirmText="삭제하기"
        isDestructive
        onConfirm={handleConfirmDeleteGame}
        onCancel={() => setDeletingGame(null)}
      />

      {/* Delete Play Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingPlay}
        title="플레이 기록 삭제"
        message={`'${deletingPlay?.gameTitle}' (${deletingPlay?.date}) 기록을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.`}
        confirmText="삭제하기"
        isDestructive
        onConfirm={handleConfirmDeletePlay}
        onCancel={() => setDeletingPlay(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
