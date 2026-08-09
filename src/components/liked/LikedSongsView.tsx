import { Clock, Heart, Play } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { formatTime } from '../../utils/formatTime'
import { TrackRow } from '../library/TrackRow'
import type { Track } from '../../types/player'

export function LikedSongsView() {
  const library = usePlayerStore((state) => state.library)
  const playTrack = usePlayerStore((state) => state.playTrack)

  const likedTracks = useMemo(() => library.filter((t) => t.liked), [library])

  const totalDuration = useMemo(
    () => likedTracks.reduce((acc, t) => acc + (t.duration || 0), 0),
    [likedTracks],
  )

  const handlePlayAll = () => {
    const playable = likedTracks.filter((t) => !t.isMissing)
    if (playable.length > 0) {
      playTrack(playable[0], playable)
    }
  }

  const handleTrackClick = (track: Track) => {
    playTrack(track, likedTracks)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex size-full max-w-5xl flex-col px-6 py-8 select-none"
    >
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 border-b border-white/[0.08] pb-8">
        {/* Heart Art Box */}
        <div className="relative aspect-square size-36 sm:size-44 shrink-0 grid place-items-center rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/20 via-purple-600/15 to-violet-950/30 text-rose-400 shadow-2xl">
          <Heart className="size-16 fill-rose-400/90" strokeWidth={1.5} />
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-300">
            Favorites
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-medium tracking-tight text-white/95 truncate">
            Liked Songs
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-white/55 font-normal">
            Your personal collection of saved favorite tracks
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-white/45 font-mono">
            <span>
              {likedTracks.length} {likedTracks.length === 1 ? 'song' : 'songs'}
            </span>
            <span>• {formatTime(totalDuration)}</span>
          </div>

          {/* Action Button */}
          {likedTracks.length > 0 ? (
            <div className="mt-5 flex items-center justify-center sm:justify-start gap-3">
              <button
                type="button"
                onClick={handlePlayAll}
                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-rose-300 to-violet-300 text-[#090b14] px-5 py-2.5 text-xs font-semibold shadow-lg hover:shadow-rose-400/25 hover:scale-102 active:scale-98 transition-all"
              >
                <Play className="size-3.5 fill-current" />
                <span>Play Liked Songs</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Tracks Content */}
      <div className="mt-6 flex-1 overflow-y-auto pr-1">
        {likedTracks.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-[#0c0e18]/30 p-8 text-center backdrop-blur-xl">
            <div className="grid size-14 place-items-center rounded-2xl border border-rose-500/20 bg-rose-500/[0.08] text-rose-300">
              <Heart className="size-7 stroke-[1.5]" />
            </div>
            <h2 className="mt-4 text-lg font-medium text-white/90">No liked songs yet</h2>
            <p className="mt-1 max-w-sm text-xs text-white/45">
              Click the heart icon on any song while listening or browsing to save your favorites here.
            </p>
          </div>
        ) : (
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
              {likedTracks.map((track, idx) => (
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
