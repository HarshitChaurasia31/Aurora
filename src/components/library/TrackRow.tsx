import { Disc3, Heart, ListPlus, Play, Trash2, Volume2 } from 'lucide-react'
import { memo, useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { formatTime } from '../../utils/formatTime'
import type { Track } from '../../types/player'

interface TrackRowProps {
  track: Track
  index: number
  showAlbum?: boolean
  showArtwork?: boolean
  onTrackClick?: (track: Track) => void
}

export const TrackRow = memo(function TrackRow({
  track,
  index,
  showAlbum = true,
  showArtwork = true,
  onTrackClick,
}: TrackRowProps) {
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const playTrack = usePlayerStore((state) => state.playTrack)
  const toggleLike = usePlayerStore((state) => state.toggleLike)
  const addToQueue = usePlayerStore((state) => state.addToQueue)
  const removeTrack = usePlayerStore((state) => state.removeTrack)
  const [failedUrl, setFailedUrl] = useState(false)

  const isSelected = currentTrack?.id === track.id
  const isCurrentPlaying = isSelected && isPlaying
  const isMissing = Boolean(track.isMissing)

  const handleClick = () => {
    if (isMissing) {
      console.warn('[TrackRow] Cannot play missing file:', track.filePath)
      return
    }
    if (onTrackClick) {
      onTrackClick(track)
    } else {
      playTrack(track)
    }
  }

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleLike(track.id)
  }

  const handleQueueClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToQueue(track)
  }

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeTrack(track.id)
  }

  return (
    <div
      onClick={handleClick}
      className={`group relative grid grid-cols-12 items-center gap-3 px-3.5 py-2.5 text-xs transition-colors rounded-xl select-none ${
        isMissing
          ? 'opacity-55 hover:bg-white/[0.03] cursor-default'
          : isSelected
            ? 'bg-violet-400/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] cursor-pointer'
            : 'text-white/70 hover:bg-white/[0.045] hover:text-white cursor-pointer'
      }`}
    >
      {/* Col 1: Index Number / Play Action / Animated Equalizer */}
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

      {/* Col 2: Artwork (Optional) + Title + Artist */}
      <div
        className={`${
          showAlbum ? 'col-span-6 sm:col-span-5' : 'col-span-8 sm:col-span-8'
        } flex items-center gap-3 min-w-0`}
      >
        {showArtwork ? (
          <div className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] shadow-sm">
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
        ) : null}

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

      {/* Col 3: Album (Hidden on mobile if needed) */}
      {showAlbum ? (
        <div className="hidden sm:block sm:col-span-4 min-w-0">
          <p className="truncate text-xs text-white/50">{track.album}</p>
        </div>
      ) : null}

      {/* Col 4: Like Button + Format / Missing Badge + Duration + Queue Action + Remove from Library */}
      <div
        className={`${
          showAlbum ? 'col-span-5 sm:col-span-2' : 'col-span-3 sm:col-span-3'
        } flex items-center justify-end gap-1.5 pr-1 font-mono text-[11px]`}
      >
        {/* Like Button */}
        {!isMissing ? (
          <button
            type="button"
            onClick={handleLikeClick}
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

        {/* Add to Queue Button (Hover) */}
        {!isMissing ? (
          <button
            type="button"
            onClick={handleQueueClick}
            aria-label="Add to Queue"
            title="Add to Queue"
            className="hidden group-hover:grid size-7 place-items-center rounded-lg text-white/40 hover:bg-white/[0.08] hover:text-violet-200 transition-colors"
          >
            <ListPlus className="size-3.5" strokeWidth={1.8} />
          </button>
        ) : null}

        {/* Remove from Library Button (Hover) */}
        <button
          type="button"
          onClick={handleRemoveClick}
          aria-label="Remove from Library"
          title="Remove from Library"
          className="hidden group-hover:grid size-7 place-items-center rounded-lg text-white/30 hover:bg-rose-500/15 hover:text-rose-300 transition-colors"
        >
          <Trash2 className="size-3.5" strokeWidth={1.7} />
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
