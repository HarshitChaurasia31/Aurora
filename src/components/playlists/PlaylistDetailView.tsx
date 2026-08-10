import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Disc3,
  Heart,
  ListMusic,
  ListPlus,
  Pencil,
  Play,
  Trash2,
  Volume2,
  X,
} from 'lucide-react'
import { memo, useRef, useState } from 'react'
import { useNavigationStore } from '../../stores/navigationStore'
import { usePlayerStore } from '../../stores/playerStore'
import { usePlaylistStore } from '../../stores/playlistStore'
import { formatTime } from '../../utils/formatTime'
import { ScrollToTopButton } from '../common/ScrollToTopButton'
import type { Track } from '../../types/player'
import type { PlaylistDetail } from '../../types/playlist'

interface PlaylistDetailViewProps {
  playlist: PlaylistDetail
  onBack: () => void
}

export const PlaylistDetailView = memo(function PlaylistDetailView({
  playlist,
  onBack,
}: PlaylistDetailViewProps) {
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const playTrack = usePlayerStore((state) => state.playTrack)
  const addToQueue = usePlayerStore((state) => state.addToQueue)
  const toggleLike = usePlayerStore((state) => state.toggleLike)
  const setImportNotification = usePlayerStore((state) => state.setImportNotification)

  const openRenameModal = usePlaylistStore((state) => state.openRenameModal)
  const openDeleteModal = usePlaylistStore((state) => state.openDeleteModal)
  const removeTrackFromPlaylist = usePlaylistStore((state) => state.removeTrackFromPlaylist)
  const movePlaylistTrack = usePlaylistStore((state) => state.movePlaylistTrack)

  const setActiveTab = useNavigationStore((state) => state.setActiveTab)
  const [failedArt, setFailedArt] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const availableTracks = playlist.tracks.filter((t) => !t.isMissing)
  const totalDuration = playlist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0)

  const handlePlayPlaylist = (startIndex = 0) => {
    if (availableTracks.length === 0) return
    const initial = Math.max(0, Math.min(startIndex, availableTracks.length - 1))
    playTrack(availableTracks[initial], availableTracks)
  }

  const handleAddAllToQueue = () => {
    if (availableTracks.length === 0) return
    for (const track of availableTracks) {
      addToQueue(track)
    }
    setImportNotification({
      message: `Added ${availableTracks.length} ${
        availableTracks.length === 1 ? 'song' : 'songs'
      } to queue`,
      timestamp: Date.now(),
    })
  }

  return (
    <div className="relative z-10 flex size-full max-w-5xl flex-col overflow-hidden px-6 py-6 select-none">
      {/* Top Bar: Back navigation */}
      <div className="flex items-center gap-3 shrink-0 mb-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/80 hover:bg-violet-400/15 hover:border-violet-300/30 hover:text-white transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="size-4 text-violet-300" strokeWidth={2} />
          <span>Playlists</span>
        </button>
      </div>

      {/* Playlist Hero Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5 backdrop-blur-xl shrink-0">
        {/* Cover Artwork */}
        <div className="relative grid size-32 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/15 bg-[#0b0e1b] shadow-2xl">
          {playlist.artworkUrl && !failedArt ? (
            <img
              src={playlist.artworkUrl}
              alt=""
              className="size-full object-cover"
              onError={() => setFailedArt(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-violet-300/60">
              <ListMusic className="size-10 stroke-[1.5]" />
            </div>
          )}
        </div>

        {/* Title & Metadata */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-violet-400/15 border border-violet-400/25 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-violet-300">
            Playlist
          </div>
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl sm:text-3xl font-semibold tracking-tight text-white/95">
              {playlist.name}
            </h1>
            <button
              type="button"
              onClick={() => openRenameModal(playlist)}
              title="Rename Playlist"
              aria-label="Rename Playlist"
              className="grid size-8 place-items-center rounded-lg text-white/40 hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => openDeleteModal(playlist)}
              title="Delete Playlist"
              aria-label="Delete Playlist"
              className="grid size-8 place-items-center rounded-lg text-white/30 hover:bg-rose-500/15 hover:text-rose-300 transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
          <p className="text-xs text-white/50 font-mono">
            {playlist.trackCount} {playlist.trackCount === 1 ? 'song' : 'songs'} • {formatTime(totalDuration)}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              disabled={availableTracks.length === 0}
              onClick={() => handlePlayPlaylist(0)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-400/20 border border-violet-400/35 px-4 py-2 text-xs font-medium text-violet-100 shadow-sm transition-colors hover:bg-violet-400/30 hover:border-violet-400/50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="size-3.5 fill-current translate-x-0.5" />
              <span>Play Playlist</span>
            </button>
            <button
              type="button"
              disabled={availableTracks.length === 0}
              onClick={handleAddAllToQueue}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ListPlus className="size-3.5" />
              <span>Add to Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tracks Container */}
      <div className="mt-5 flex-1 overflow-hidden flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
        {/* Table Header */}
        <div className="grid grid-cols-12 items-center gap-3 border-b border-white/10 px-4 py-2.5 text-[11px] font-medium text-white/40 uppercase tracking-wider font-mono shrink-0">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-6 sm:col-span-5">Title</div>
          <div className="hidden sm:block sm:col-span-4">Album</div>
          <div className="col-span-5 sm:col-span-2 text-right pr-2">Duration</div>
        </div>

        {/* Tracks List / Empty State */}
        <div
          ref={scrollRef}
          onScroll={(e) => setShowScrollTop(e.currentTarget.scrollTop > 220)}
          className="flex-1 overflow-y-auto divide-y divide-white/[0.03] p-1.5"
        >
          {playlist.tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ListMusic className="size-10 text-white/20 mb-3 stroke-[1.5]" />
              <p className="text-sm font-medium text-white/80">Your playlist is empty</p>
              <p className="text-xs text-white/40 mt-1 max-w-xs">
                Add songs from your Library or Search to build your custom mix.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('Library')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-xs font-medium text-violet-200 hover:bg-violet-500/25 transition-colors"
              >
                <span>Go to Library</span>
              </button>
            </div>
          ) : (
            playlist.tracks.map((track, index) => (
              <PlaylistTrackRow
                key={`${track.id}_${index}`}
                track={track}
                index={index}
                totalCount={playlist.tracks.length}
                onPlay={() => handlePlayPlaylist(index)}
                onMoveUp={() => movePlaylistTrack(playlist.id, index, index - 1)}
                onMoveDown={() => movePlaylistTrack(playlist.id, index, index + 1)}
                onRemove={() => removeTrackFromPlaylist(playlist.id, track.id)}
                onLike={() => toggleLike(track.id)}
                onQueue={() => addToQueue(track)}
                isCurrentPlaying={Boolean(currentTrack?.id === track.id && isPlaying)}
                isSelected={Boolean(currentTrack?.id === track.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Floating Scroll to Top button */}
      <ScrollToTopButton
        visible={showScrollTop}
        onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
      />
    </div>
  )
})

interface PlaylistTrackRowProps {
  track: Track
  index: number
  totalCount: number
  isCurrentPlaying: boolean
  isSelected: boolean
  onPlay: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onLike: () => void
  onQueue: () => void
}

const PlaylistTrackRow = memo(function PlaylistTrackRow({
  track,
  index,
  totalCount,
  isCurrentPlaying,
  isSelected,
  onPlay,
  onMoveUp,
  onMoveDown,
  onRemove,
  onLike,
  onQueue,
}: PlaylistTrackRowProps) {
  const isMissing = Boolean(track.isMissing)
  const [failedUrl, setFailedUrl] = useState(false)

  const handleRowClick = () => {
    if (!isMissing) {
      onPlay()
    }
  }

  return (
    <div
      onClick={handleRowClick}
      className={`group relative grid grid-cols-12 items-center gap-3 px-3 py-2 text-xs transition-colors rounded-xl select-none ${
        isMissing
          ? 'opacity-55 hover:bg-white/[0.03] cursor-default'
          : isSelected
            ? 'bg-violet-400/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] cursor-pointer'
            : 'text-white/70 hover:bg-white/[0.045] hover:text-white cursor-pointer'
      }`}
    >
      {/* Col 1: Index Number / Animated Equalizer / Play button */}
      <div className="col-span-1 flex items-center justify-center font-mono text-[11px]">
        {isCurrentPlaying ? (
          <div className="flex items-end gap-0.5 h-3.5 w-3.5 justify-center">
            <span className="w-0.5 bg-violet-300 animate-[bounce_0.8s_ease-in-out_infinite] h-full" />
            <span className="w-0.5 bg-violet-300 animate-[bounce_1.1s_ease-in-out_infinite] h-2/3" />
            <span className="w-0.5 bg-violet-300 animate-[bounce_0.9s_ease-in-out_infinite] h-4/5" />
          </div>
        ) : isSelected ? (
          <Volume2 className="size-3.5 text-violet-300/80" />
        ) : (
          <>
            <span className="group-hover:hidden text-white/35">{index + 1}</span>
            <button
              type="button"
              disabled={isMissing}
              aria-label={`Play ${track.title}`}
              className="hidden group-hover:grid size-6 place-items-center rounded-md bg-violet-400/20 text-violet-200 hover:bg-violet-400/30"
            >
              <Play className="size-3 fill-current translate-x-0.5" />
            </button>
          </>
        )}
      </div>

      {/* Col 2: Artwork + Title + Artist */}
      <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
        <div className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
          {track.artworkUrl && !failedUrl ? (
            <img
              src={track.artworkUrl}
              alt=""
              className="size-full object-cover"
              onError={() => setFailedUrl(true)}
            />
          ) : (
            <Disc3 className="size-4 text-violet-300/40" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-[0.88rem] font-medium tracking-tight ${
              isSelected ? 'text-violet-200' : 'text-white/90'
            }`}
          >
            {track.title}
          </p>
          <p className="truncate text-[11px] text-white/45 font-normal mt-0.5">{track.artist}</p>
        </div>
      </div>

      {/* Col 3: Album */}
      <div className="hidden sm:block sm:col-span-4 min-w-0">
        <p className="truncate text-xs text-white/50">{track.album}</p>
      </div>

      {/* Col 4: Reordering (Up/Down) + Like + Queue + Remove + Duration */}
      <div className="col-span-5 sm:col-span-2 flex items-center justify-end gap-1.5 pr-1 font-mono text-[11px]">
        {/* Reordering Up/Down controls on hover */}
        <div className="hidden group-hover:flex items-center gap-0.5 text-white/30">
          <button
            type="button"
            disabled={index === 0}
            onClick={(e) => {
              e.stopPropagation()
              onMoveUp()
            }}
            title="Move Up"
            aria-label="Move Up"
            className="grid size-6 place-items-center rounded hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent"
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            disabled={index === totalCount - 1}
            onClick={(e) => {
              e.stopPropagation()
              onMoveDown()
            }}
            title="Move Down"
            aria-label="Move Down"
            className="grid size-6 place-items-center rounded hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent"
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>

        {/* Like */}
        {!isMissing ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onLike()
            }}
            aria-label={track.liked ? 'Unlike track' : 'Like track'}
            className={`grid size-7 place-items-center rounded-lg transition-colors ${
              track.liked
                ? 'text-rose-400 hover:text-rose-300'
                : 'text-white/20 opacity-0 group-hover:opacity-100 hover:text-white/80'
            }`}
          >
            <Heart className={`size-3.5 ${track.liked ? 'fill-rose-400' : ''}`} strokeWidth={1.8} />
          </button>
        ) : null}

        {/* Add to Queue */}
        {!isMissing ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onQueue()
            }}
            title="Add to Queue"
            aria-label="Add to Queue"
            className="hidden group-hover:grid size-7 place-items-center rounded-lg text-white/40 hover:bg-white/[0.08] hover:text-violet-200 transition-colors"
          >
            <ListPlus className="size-3.5" strokeWidth={1.8} />
          </button>
        ) : null}

        {/* Remove from Playlist (does NOT delete file or library track) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          title="Remove from Playlist"
          aria-label="Remove from Playlist"
          className="hidden group-hover:grid size-7 place-items-center rounded-lg text-white/30 hover:bg-rose-500/15 hover:text-rose-300 transition-colors"
        >
          <X className="size-3.5" strokeWidth={1.8} />
        </button>

        {/* Missing Badge vs Duration */}
        {isMissing ? (
          <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] uppercase font-mono tracking-wider text-amber-300">
            Missing
          </span>
        ) : (
          <span className="text-white/40">{formatTime(track.duration)}</span>
        )}
      </div>
    </div>
  )
})
