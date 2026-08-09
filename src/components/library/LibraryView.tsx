import { ArrowUpDown, Clock, FolderPlus, Music, Search, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useState } from 'react'
import { importAudioFolder, importSingleAudioFile } from '../../features/importer/fileImporter'
import { usePlayerStore } from '../../stores/playerStore'
import { formatTime } from '../../utils/formatTime'
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
    playTrack(track, processedTracks.length > 0 ? processedTracks : library)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex size-full max-w-5xl flex-col px-6 py-8 select-none"
    >
      {/* Toast Notification on Import */}
      <AnimatePresence>
        {importNotification ? (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed top-6 right-8 z-50 flex items-center gap-2.5 rounded-2xl border border-violet-400/30 bg-[#121324]/90 px-4 py-2.5 text-xs text-violet-200 shadow-[0_12px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <Sparkles className="size-4 text-violet-300" />
            <span>{importNotification.message}</span>
            <button
              type="button"
              onClick={() => setImportNotification(null)}
              className="ml-2 text-white/40 hover:text-white"
            >
              ✕
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-medium tracking-tight text-white/90">Music Library</h1>
            <span className="rounded-full bg-violet-400/[0.12] border border-violet-400/20 px-2.5 py-0.5 text-xs font-medium text-violet-300 font-mono">
              {library.length} {library.length === 1 ? 'track' : 'tracks'}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/45">
            Local music collection • {formatTime(totalDuration)} total duration
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <AddMusicButton />
        </div>
      </div>

      {/* Control Bar: Filter Tabs + Search + Sort */}
      {library.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-white/[0.03] p-1 border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-violet-400/20 text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              All ({library.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('liked')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilter === 'liked'
                  ? 'bg-violet-400/20 text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Liked ({likedCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('available')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilter === 'available'
                  ? 'bg-violet-400/20 text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Available ({availableCount})
            </button>

            {missingCount > 0 ? (
              <button
                type="button"
                onClick={() => setActiveFilter('missing')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeFilter === 'missing'
                    ? 'bg-amber-500/20 text-amber-200 shadow-sm'
                    : 'text-amber-400/60 hover:text-amber-300'
                }`}
              >
                Missing ({missingCount})
              </button>
            ) : null}
          </div>

          {/* Right: Search Input + Sort Dropdown */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center">
              <Search className="absolute left-3 size-3.5 text-white/40" strokeWidth={1.8} />
              <input
                type="text"
                placeholder="Filter library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 w-40 sm:w-52 rounded-xl border border-white/10 bg-white/[0.04] pl-8.5 pr-3 text-xs text-white placeholder-white/35 backdrop-blur-md transition-colors focus:border-violet-400/50 focus:bg-white/[0.07] focus:outline-none"
              />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/70">
              <ArrowUpDown className="size-3 text-white/40" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="bg-transparent text-xs text-white/80 focus:outline-none cursor-pointer pr-1"
              >
                <option value="dateAdded" className="bg-[#121324] text-white">
                  Recently Added
                </option>
                <option value="title" className="bg-[#121324] text-white">
                  Title
                </option>
                <option value="artist" className="bg-[#121324] text-white">
                  Artist
                </option>
                <option value="album" className="bg-[#121324] text-white">
                  Album
                </option>
                <option value="duration" className="bg-[#121324] text-white">
                  Duration
                </option>
              </select>

              <button
                type="button"
                aria-label="Toggle sort order"
                onClick={() => setSortAsc(!sortAsc)}
                className="ml-1 text-[10px] text-violet-300 font-mono hover:text-white"
              >
                {sortAsc ? '▲' : '▼'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Library Content List */}
      <div className="mt-5 flex-1 overflow-y-auto pr-1">
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
            <div className="grid grid-cols-12 gap-3 border-b border-white/[0.06] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
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
    </motion.div>
  )
}
