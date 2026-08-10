import { ArrowLeft, Clock, Disc3, Play } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { formatTime } from '../../utils/formatTime'
import { ScrollToTopButton } from '../common/ScrollToTopButton'
import { TrackRow } from '../library/TrackRow'

interface AlbumDetailViewProps {
  albumName: string
  onBack: () => void
}

export function AlbumDetailView({ albumName, onBack }: AlbumDetailViewProps) {
  const library = usePlayerStore((state) => state.library)
  const playAlbum = usePlayerStore((state) => state.playAlbum)
  const playTrack = usePlayerStore((state) => state.playTrack)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const albumTracks = useMemo(() => {
    const norm = albumName.toLowerCase().trim()
    return library
      .filter((t) => t.album.toLowerCase().trim() === norm)
      .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0) || a.dateAdded - b.dateAdded)
  }, [library, albumName])

  const representativeTrack = albumTracks[0]
  const artistName = representativeTrack?.artist || 'Unknown Artist'
  const artworkUrl = albumTracks.find((t) => t.artworkUrl)?.artworkUrl
  const totalDuration = useMemo(
    () => albumTracks.reduce((acc, t) => acc + (t.duration || 0), 0),
    [albumTracks],
  )
  const year = representativeTrack?.year

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 220)
  }

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 mx-auto flex size-full max-w-5xl flex-col px-6 py-8 select-none"
    >
      {/* Back Button */}
      <div className="flex items-center gap-3 shrink-0 mb-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/80 hover:bg-violet-400/15 hover:border-violet-300/30 hover:text-white transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="size-4 text-violet-300" strokeWidth={2} />
          <span>Albums</span>
        </button>
      </div>

      {/* Album Hero Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 border-b border-white/[0.08] pb-8 shrink-0">
        {/* Cover Art */}
        <div className="relative aspect-square size-40 sm:size-48 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0e18] shadow-2xl">
          {artworkUrl ? (
            <img src={artworkUrl} alt={`Cover for ${albumName}`} className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center bg-violet-950/20 text-violet-300/40">
              <Disc3 className="size-16 stroke-[1.2]" />
            </div>
          )}
        </div>

        {/* Album Info */}
        <div className="flex-1 text-center sm:text-left">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300 font-mono">
            Album
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-medium tracking-tight text-white/95 truncate">
            {albumName}
          </h1>
          <p className="mt-1 text-sm text-white/60 font-normal">{artistName}</p>

          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-white/45 font-mono">
            {year ? <span>{year} •</span> : null}
            <span>
              {albumTracks.length} {albumTracks.length === 1 ? 'song' : 'songs'}
            </span>
            <span>• {formatTime(totalDuration)}</span>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex items-center justify-center sm:justify-start gap-3">
            <button
              type="button"
              onClick={() => playAlbum(albumName, albumTracks)}
              className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-300 to-indigo-300 text-[#090b14] px-5 py-2.5 text-xs font-semibold shadow-lg hover:shadow-violet-400/25 hover:scale-102 active:scale-98 transition-all cursor-pointer"
            >
              <Play className="size-3.5 fill-current" />
              <span>Play Album</span>
            </button>
          </div>
        </div>
      </div>

      {/* Album Tracks Table */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="mt-6 flex-1 overflow-y-auto pr-1"
      >
        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0e18]/60 backdrop-blur-xl shadow-lg">
          <div className="grid grid-cols-12 gap-3 border-b border-white/[0.06] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40 font-mono">
            <span className="col-span-1 text-center">#</span>
            <span className="col-span-8 sm:col-span-8">Title</span>
            <span className="col-span-3 sm:col-span-3 flex items-center justify-end gap-1 pr-2">
              <Clock className="size-3" strokeWidth={1.8} />
            </span>
          </div>

          <div className="divide-y divide-white/[0.035] p-1">
            {albumTracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                showAlbum={false}
                onTrackClick={(t) => playTrack(t, albumTracks)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Scroll to Top button */}
      <ScrollToTopButton visible={showScrollTop} onClick={scrollToTop} />
    </motion.div>
  )
}
