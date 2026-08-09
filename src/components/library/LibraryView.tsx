import { Clock, Disc3, FolderPlus, Music, Play, Search, Volume2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { importAudioFolder, importSingleAudioFile } from '../../features/importer/fileImporter'
import { usePlayerStore } from '../../stores/playerStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { formatTime } from '../../utils/formatTime'
import { AddMusicButton } from './AddMusicButton'
import type { Track } from '../../types/player'

export function LibraryView() {
  const library = usePlayerStore((state) => state.library)
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const playTrack = usePlayerStore((state) => state.playTrack)
  const setActiveTab = useNavigationStore((state) => state.setActiveTab)

  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null)

  const filteredTracks = library.filter((track) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      track.title.toLowerCase().includes(q) ||
      track.artist.toLowerCase().includes(q) ||
      track.album.toLowerCase().includes(q)
    )
  })

  const handleTrackClick = (track: Track) => {
    if (track.isMissing) {
      console.warn('[LibraryView] Cannot play missing file:', track.filePath)
      return
    }
    playTrack(track, filteredTracks.length > 0 ? filteredTracks : library)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex size-full max-w-5xl flex-col px-6 py-8 select-none"
    >
      {/* Library Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-medium tracking-tight text-white/90">Music Library</h1>
            <span className="rounded-full bg-violet-400/[0.12] border border-violet-400/20 px-2.5 py-0.5 text-xs font-medium text-violet-300">
              {library.length} {library.length === 1 ? 'track' : 'tracks'}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/45">Local audio tracks stored on your computer</p>
        </div>

        {/* Actions & Search */}
        <div className="flex items-center gap-3">
          {library.length > 0 ? (
            <div className="relative flex items-center">
              <Search className="absolute left-3 size-3.5 text-white/40" strokeWidth={1.8} />
              <input
                type="text"
                placeholder="Filter tracks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-44 sm:w-56 rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-3 text-xs text-white placeholder-white/35 backdrop-blur-md transition-colors focus:border-violet-400/50 focus:bg-white/[0.07] focus:outline-none"
              />
            </div>
          ) : null}

          <AddMusicButton />
        </div>
      </div>

      {/* Library Content */}
      <div className="mt-6 flex-1 overflow-y-auto pr-1">
        {library.length === 0 ? (
          /* Tasteful Empty State */
          <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0c0e18]/40 p-8 text-center backdrop-blur-xl">
            <div className="grid size-16 place-items-center rounded-2xl border border-white/10 bg-violet-500/[0.08] text-violet-300 shadow-inner">
              <Music className="size-8 stroke-[1.5]" />
            </div>
            <h2 className="mt-5 text-lg font-medium text-white/90">Your library is empty</h2>
            <p className="mt-1.5 max-w-sm text-xs text-white/45">
              Add individual audio files or select an entire music folder from your PC to begin listening.
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
        ) : filteredTracks.length === 0 ? (
          /* No search results */
          <div className="py-16 text-center text-xs text-white/40">
            No local tracks match &quot;{searchQuery}&quot;
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

            <div className="divide-y divide-white/[0.04]">
              {filteredTracks.map((track, idx) => {
                const isSelected = currentTrack?.id === track.id
                const isHovered = hoveredTrackId === track.id

                return (
                  <div
                    key={track.id}
                    onMouseEnter={() => setHoveredTrackId(track.id)}
                    onMouseLeave={() => setHoveredTrackId(null)}
                    onDoubleClick={() => {
                      if (!track.isMissing) {
                        handleTrackClick(track)
                        setActiveTab('Home')
                      }
                    }}
                    className={`group grid grid-cols-12 items-center gap-3 px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                      track.isMissing
                        ? 'opacity-50 hover:bg-white/[0.02]'
                        : isSelected
                          ? 'bg-violet-400/[0.12] text-white'
                          : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    {/* Index or Play Button */}
                    <div className="col-span-1 text-center font-variant-numeric-tabular">
                      {isHovered || isSelected ? (
                        <button
                          type="button"
                          aria-label={`Play ${track.title}`}
                          disabled={track.isMissing}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTrackClick(track)
                          }}
                          className={`grid size-6 mx-auto place-items-center rounded-md ${
                            track.isMissing
                              ? 'text-white/20 cursor-not-allowed'
                              : 'bg-violet-400/20 text-violet-300 hover:bg-violet-400/30'
                          }`}
                        >
                          {isSelected && isPlaying ? (
                            <Volume2 className="size-3.5 text-violet-300 animate-pulse" />
                          ) : (
                            <Play className="size-3.5 fill-current" />
                          )}
                        </button>
                      ) : (
                        <span className="text-white/35">{idx + 1}</span>
                      )}
                    </div>

                    {/* Artwork + Title + Artist */}
                    <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                      <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
                        {track.artworkUrl ? (
                          <img
                            src={track.artworkUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <Disc3 className="size-4 text-violet-300/50" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate font-medium ${
                            isSelected ? 'text-violet-200' : 'text-white/90'
                          }`}
                        >
                          {track.title}
                        </p>
                        <p className="truncate text-[11px] text-white/45">{track.artist}</p>
                      </div>
                    </div>

                    {/* Album */}
                    <div className="hidden sm:block sm:col-span-4 min-w-0">
                      <p className="truncate text-white/50">{track.album}</p>
                    </div>

                    {/* Duration & Format Badge */}
                    <div className="col-span-5 sm:col-span-2 flex items-center justify-end gap-2.5 pr-2 font-variant-numeric-tabular">
                      {track.isMissing ? (
                        <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] uppercase font-mono tracking-wider text-amber-300">
                          Missing
                        </span>
                      ) : (
                        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] uppercase font-mono tracking-wider text-white/40">
                          {track.format}
                        </span>
                      )}
                      <span className="text-white/50">{formatTime(track.duration)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
