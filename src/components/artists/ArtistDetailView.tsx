import { ArrowLeft, Clock, Disc3, Play, UserRound } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { formatTime } from '../../utils/formatTime'
import { ScrollToTopButton } from '../common/ScrollToTopButton'
import { TrackRow } from '../library/TrackRow'
import type { Track } from '../../types/player'

interface ArtistDetailViewProps {
  artistName: string
  onBack: () => void
  onSelectAlbum?: (albumName: string) => void
}

export function ArtistDetailView({ artistName, onBack, onSelectAlbum }: ArtistDetailViewProps) {
  const library = usePlayerStore((state) => state.library)
  const playArtist = usePlayerStore((state) => state.playArtist)
  const playTrack = usePlayerStore((state) => state.playTrack)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const artistTracks = useMemo(() => {
    const norm = artistName.toLowerCase().trim()
    return library
      .filter((t) => t.artist.toLowerCase().trim() === norm)
      .sort((a, b) => a.album.localeCompare(b.album) || a.dateAdded - b.dateAdded)
  }, [library, artistName])

  // Distinct albums by this artist
  const artistAlbums = useMemo(() => {
    const map = new Map<string, { name: string; artworkUrl?: string | null; tracks: Track[] }>()
    for (const t of artistTracks) {
      const normKey = t.album.toLowerCase().trim()
      if (!map.has(normKey)) {
        map.set(normKey, {
          name: t.album,
          artworkUrl: t.artworkUrl,
          tracks: [t],
        })
      } else {
        map.get(normKey)!.tracks.push(t)
      }
    }
    return Array.from(map.values())
  }, [artistTracks])

  const totalDuration = useMemo(
    () => artistTracks.reduce((acc, t) => acc + (t.duration || 0), 0),
    [artistTracks],
  )

  const avatarInitial = artistName.charAt(0).toUpperCase() || 'A'

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
      className="relative z-10 flex size-full max-w-5xl flex-col px-6 py-8 select-none"
    >
      {/* Back Button */}
      <div className="flex items-center gap-3 shrink-0 mb-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/80 hover:bg-violet-400/15 hover:border-violet-300/30 hover:text-white transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="size-4 text-violet-300" strokeWidth={2} />
          <span>Artists</span>
        </button>
      </div>

      {/* Artist Hero Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 border-b border-white/[0.08] pb-8 shrink-0">
        {/* Avatar Circle */}
        <div className="relative grid size-36 sm:size-44 shrink-0 place-items-center rounded-full border-2 border-white/10 bg-gradient-to-tr from-violet-600/30 via-indigo-500/20 to-purple-400/20 text-violet-200 text-5xl font-semibold shadow-2xl">
          <span>{avatarInitial}</span>
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300 font-mono">
            Artist
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-medium tracking-tight text-white/95 truncate">
            {artistName}
          </h1>

          <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-white/45 font-mono">
            <span>
              {artistTracks.length} {artistTracks.length === 1 ? 'song' : 'songs'}
            </span>
            <span>•</span>
            <span>
              {artistAlbums.length} {artistAlbums.length === 1 ? 'album' : 'albums'}
            </span>
            <span>• {formatTime(totalDuration)}</span>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex items-center justify-center sm:justify-start gap-3">
            <button
              type="button"
              onClick={() => playArtist(artistName, artistTracks)}
              className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-300 to-indigo-300 text-[#090b14] px-5 py-2.5 text-xs font-semibold shadow-lg hover:shadow-violet-400/25 hover:scale-102 active:scale-98 transition-all cursor-pointer"
            >
              <Play className="size-3.5 fill-current" />
              <span>Play Artist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Artist Content Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="mt-6 flex-1 overflow-y-auto pr-1 space-y-8 pb-12"
      >
        {/* Discography Albums (if any) */}
        {artistAlbums.length > 0 ? (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45 mb-3 flex items-center gap-2 font-mono">
              <UserRound className="size-3.5 text-violet-300" />
              Albums ({artistAlbums.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {artistAlbums.map((album) => (
                <div
                  key={album.name}
                  onClick={() => onSelectAlbum?.(album.name)}
                  className="group cursor-pointer rounded-xl border border-white/[0.06] bg-[#0c0e18]/40 p-3 hover:border-violet-400/30 hover:bg-[#121324]/70 transition-all"
                >
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-white/10 bg-[#080912]">
                    {album.artworkUrl ? (
                      <img src={album.artworkUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="grid size-full place-items-center text-violet-300/30">
                        <Disc3 className="size-8" />
                      </div>
                    )}
                  </div>
                  <h3 className="mt-2 text-xs font-medium text-white/90 truncate group-hover:text-violet-200">
                    {album.name}
                  </h3>
                  <p className="text-[10px] text-white/40 font-mono mt-0.5">
                    {album.tracks.length} {album.tracks.length === 1 ? 'track' : 'tracks'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Tracks List */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45 mb-3 font-mono">
            All Songs ({artistTracks.length})
          </h2>
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
              {artistTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  onTrackClick={(t) => playTrack(t, artistTracks)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Scroll to Top button */}
      <ScrollToTopButton visible={showScrollTop} onClick={scrollToTop} />
    </motion.div>
  )
}
