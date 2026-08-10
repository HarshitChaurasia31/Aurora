import { ArrowUpDown, Clock, FolderPlus, Music, Search, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { importAudioFolder, importSingleAudioFile } from '../../features/importer/fileImporter'
import { usePlayerStore } from '../../stores/playerStore'
import { formatTime } from '../../utils/formatTime'
import { ScrollToTopButton } from '../common/ScrollToTopButton'
import { AddMusicButton } from './AddMusicButton'
import { TrackRow } from './TrackRow'
import type { Track } from '../../types/player'

type SortKey = 'dateAdded' | 'title' | 'artist' | 'album' | 'duration'
type FilterTab = 'all' | 'liked' | 'available' | 'missing'

export function LibraryView() {
  const library = usePlayerStore((state) => state.library)
  const playTrack = usePlayerStore((state) => state.playTrack)
  const importNotification = usePlayerStore((state) => state.importNotification)
  const setImportNotification = usePlayerStore((state) => state.setImportNotification)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [sortKey, setSortKey] = useState<SortKey>('dateAdded')
  const [sortAsc, setSortAsc] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Counts
  const likedCount = useMemo(() => library.filter((t) => t.liked).length, [library])
  const missingCount = useMemo(() => library.filter((t) => t.isMissing).length, [library])
  const availableCount = library.length - missingCount
  const totalDuration = useMemo(
    () => library.reduce((acc, t) => acc + (t.duration || 0), 0),
    [library],
  )

  // Filtered and sorted tracks
  const processedTracks = useMemo(() => {
    let result = library

    // Filter by tab
    if (activeFilter === 'liked') {
      result = result.filter((t) => t.liked)
    } else if (activeFilter === 'available') {
      result = result.filter((t) => !t.isMissing)
    } else if (activeFilter === 'missing') {
      result = result.filter((t) => t.isMissing)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q),
      )
    }

    // Sort
    return [...result].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'artist':
          cmp = a.artist.localeCompare(b.artist)
          break
        case 'album':
          cmp = a.album.localeCompare(b.album)
          break
        case 'duration':
          cmp = a.duration - b.duration
          break
        case 'dateAdded':
        default:
          cmp = a.dateAdded - b.dateAdded
          break
      }
      return sortAsc ? cmp : -cmp
    })
  }, [library, activeFilter, searchQuery, sortKey, sortAsc])

  const handleTrackClick = (track: Track) => {
    // Exclude missing tracks from the playable queue
    const playableQueue = processedTracks.filter((t) => !t.isMissing)
    playTrack(track, playableQueue)
  }

  const handleSortClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 220)
  }

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 mx-auto flex size-full max-w-6xl flex-col px-6 py-6 select-none"
    >
      {/* Toast Feedback Notification */}
      <AnimatePresence>
        {importNotification ? (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 right-6 z-30 flex items-center gap-2 rounded-xl border border-violet-400/30 bg-[#121324]/90 px-3.5 py-2 text-xs font-medium text-violet-200 shadow-xl backdrop-blur-xl"
          >
            <Sparkles className="size-3.5 text-violet-300 animate-pulse" />
            <span>{importNotification.message}</span>
            <button
              type="button"
              onClick={() => setImportNotification(null)}
              className="ml-2 text-white/40 hover:text-white"
            >
              ×
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white/95">
              Local Library
            </h1>
            <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-xs font-mono text-white/60">
              {library.length} {library.length === 1 ? 'song' : 'songs'}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/45">
            {availableCount} available • {formatTime(totalDuration)} total playtime
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <AddMusicButton />
        </div>
      </div>

      {/* Controls Bar: Search & Filter Tabs & Sort */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1 text-xs backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-violet-400/20 text-violet-200 shadow-sm'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            All ({library.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('liked')}
            className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeFilter === 'liked'
                ? 'bg-violet-400/20 text-violet-200 shadow-sm'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            Liked ({likedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('available')}
            className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeFilter === 'available'
                ? 'bg-violet-400/20 text-violet-200 shadow-sm'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            Available ({availableCount})
          </button>
          {missingCount > 0 ? (
            <button
              type="button"
              onClick={() => setActiveFilter('missing')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeFilter === 'missing'
                  ? 'bg-amber-500/20 text-amber-200 shadow-sm'
                  : 'text-amber-400/60 hover:text-amber-300'
              }`}
            >
              Missing ({missingCount})
            </button>
          ) : null}
        </div>

        {/* Inline Search and Sort */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 size-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 w-44 sm:w-56 rounded-xl border border-white/[0.08] bg-white/[0.03] pl-8.5 pr-3 text-xs text-white placeholder-white/30 outline-none transition-all focus:border-violet-400/40 focus:bg-white/[0.06] focus:w-64"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-xs text-white/40 hover:text-white"
              >
                ×
              </button>
            ) : null}
          </div>

          {/* Sort Selector Dropdown/Button */}
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => handleSortClick('dateAdded')}
              className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
                sortKey === 'dateAdded' ? 'bg-white/[0.08] text-white' : 'text-white/45 hover:text-white'
              }`}
            >
              Recent
            </button>
            <button
              type="button"
              onClick={() => handleSortClick('title')}
              className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
                sortKey === 'title' ? 'bg-white/[0.08] text-white' : 'text-white/45 hover:text-white'
              }`}
            >
              Title
            </button>
            <button
              type="button"
              onClick={() => handleSortClick('artist')}
              className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
                sortKey === 'artist' ? 'bg-white/[0.08] text-white' : 'text-white/45 hover:text-white'
              }`}
            >
              Artist
            </button>
            <button
              type="button"
              onClick={() => handleSortClick('duration')}
              className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
                sortKey === 'duration' ? 'bg-white/[0.08] text-white' : 'text-white/45 hover:text-white'
              }`}
            >
              Time
            </button>
            <button
              type="button"
              onClick={() => setSortAsc(!sortAsc)}
              title={sortAsc ? 'Ascending' : 'Descending'}
              className="grid size-7 place-items-center rounded-lg text-white/45 hover:bg-white/[0.06] hover:text-white"
            >
              <ArrowUpDown className={`size-3.5 ${sortAsc ? 'text-violet-300' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Missing Files Notice Banner (if any) */}
      {missingCount > 0 && activeFilter !== 'missing' ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-2.5 text-xs text-amber-200/90 backdrop-blur-md">
          <span>
            ⚠️ {missingCount} {missingCount === 1 ? 'track is' : 'tracks are'} currently missing from
            their stored disk path.
          </span>
          <button
            type="button"
            onClick={() => setActiveFilter('missing')}
            className="font-medium underline hover:text-amber-100 ml-3"
          >
            View missing
          </button>
        </div>
      ) : null}

      {/* Library Content List */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="mt-5 flex-1 overflow-y-auto pr-1"
      >
        {library.length === 0 ? (
          /* Empty Library State */
          <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0c0e18]/40 p-8 text-center backdrop-blur-xl">
            <div className="grid size-16 place-items-center rounded-2xl border border-white/10 bg-violet-500/[0.08] text-violet-300 shadow-inner">
              <Music className="size-8 stroke-[1.5]" />
            </div>
            <h2 className="mt-5 text-lg font-medium text-white/90">Your library is empty</h2>
            <p className="mt-1.5 max-w-sm text-xs text-white/45">
              Add music from your computer to get started listening with Aurora.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => importSingleAudioFile()}
                className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/20 px-4 py-2 text-xs font-medium text-violet-200 transition-colors hover:bg-violet-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
              >
                <Music className="size-3.5" strokeWidth={1.8} />
                <span>Add Song</span>
              </button>

              <button
                type="button"
                onClick={() => importAudioFolder()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/[0.1] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
              >
                <FolderPlus className="size-3.5" strokeWidth={1.8} />
                <span>Add Folder</span>
              </button>
            </div>
          </div>
        ) : processedTracks.length === 0 ? (
          /* No Matches State */
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-[#0c0e18]/20 p-8 text-center backdrop-blur-md">
            <Search className="size-8 text-white/20 stroke-[1.5]" />
            <p className="mt-3 text-sm font-medium text-white/70">No tracks found</p>
            <p className="mt-1 text-xs text-white/40">
              Try adjusting your filter or search query.
            </p>
          </div>
        ) : (
          /* Track List Table */
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0e18]/60 backdrop-blur-xl shadow-lg">
            <div className="grid grid-cols-12 gap-3 border-b border-white/[0.06] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40 font-mono">
              <span className="col-span-1 text-center">#</span>
              <span className="col-span-6 sm:col-span-5">Title</span>
              <span className="hidden sm:block sm:col-span-4 truncate">Album</span>
              <span className="col-span-5 sm:col-span-2 flex items-center justify-end gap-1 pr-2">
                <Clock className="size-3" strokeWidth={1.8} />
              </span>
            </div>

            <div className="divide-y divide-white/[0.035] p-1">
              {processedTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  onTrackClick={handleTrackClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Scroll to Top button */}
      <ScrollToTopButton visible={showScrollTop} onClick={scrollToTop} />
    </motion.div>
  )
}
