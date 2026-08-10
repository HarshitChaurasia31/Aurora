import { Play, UserRound } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { ScrollToTopButton } from '../common/ScrollToTopButton'
import { ArtistDetailView } from './ArtistDetailView'
import type { Track } from '../../types/player'

interface ArtistGroup {
  name: string
  tracks: Track[]
  albumsCount: number
}

interface ArtistsViewProps {
  initialArtist?: string | null
  onClearInitialArtist?: () => void
  onSelectAlbum?: (albumName: string) => void
}

export function ArtistsView({ initialArtist, onClearInitialArtist, onSelectAlbum }: ArtistsViewProps) {
  const library = usePlayerStore((state) => state.library)
  const playArtist = usePlayerStore((state) => state.playArtist)
  const [selectedArtist, setSelectedArtist] = useState<string | null>(initialArtist || null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Derive normalized artist groups
  const artists = useMemo(() => {
    const map = new Map<string, { name: string; tracks: Track[]; albumsSet: Set<string> }>()

    for (const track of library) {
      const artistName = track.artist?.trim() || 'Unknown Artist'
      const normKey = artistName.toLowerCase().trim()

      if (!map.has(normKey)) {
        const albumsSet = new Set<string>()
        if (track.album) albumsSet.add(track.album.toLowerCase().trim())
        map.set(normKey, {
          name: artistName,
          tracks: [track],
          albumsSet,
        })
      } else {
        const group = map.get(normKey)!
        group.tracks.push(track)
        if (track.album) group.albumsSet.add(track.album.toLowerCase().trim())
      }
    }

    const groups: ArtistGroup[] = Array.from(map.values()).map((g) => ({
      name: g.name,
      tracks: g.tracks,
      albumsCount: g.albumsSet.size,
    }))

    return groups.sort((a, b) => a.name.localeCompare(b.name))
  }, [library])

  const handleBack = () => {
    setSelectedArtist(null)
    onClearInitialArtist?.()
  }

  if (selectedArtist) {
    return (
      <ArtistDetailView
        artistName={selectedArtist}
        onBack={handleBack}
        onSelectAlbum={onSelectAlbum}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 mx-auto flex size-full max-w-5xl flex-col px-6 py-8 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-6 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-medium tracking-tight text-white/90">Artists</h1>
            <span className="rounded-full bg-violet-400/[0.12] border border-violet-400/20 px-2.5 py-0.5 text-xs font-medium text-violet-300 font-mono">
              {artists.length} {artists.length === 1 ? 'artist' : 'artists'}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/45">Browse your local music collection by artist</p>
        </div>
      </div>

      {/* Grid Content */}
      <div
        ref={scrollRef}
        onScroll={(e) => setShowScrollTop(e.currentTarget.scrollTop > 220)}
        className="mt-6 flex-1 overflow-y-auto pr-1"
      >
        {artists.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-[#0c0e18]/30 p-8 text-center backdrop-blur-xl">
            <div className="grid size-14 place-items-center rounded-2xl border border-white/10 bg-violet-400/[0.08] text-violet-300">
              <UserRound className="size-7 stroke-[1.5]" />
            </div>
            <h2 className="mt-4 text-lg font-medium text-white/90">No artists available</h2>
            <p className="mt-1 max-w-sm text-xs text-white/45">
              Import songs to automatically organize and view your artists here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 pb-12">
            <AnimatePresence>
              {artists.map((artist) => {
                const initial = artist.name.charAt(0).toUpperCase() || 'A'
                return (
                  <div
                    key={artist.name}
                    onClick={() => setSelectedArtist(artist.name)}
                    className="group relative flex flex-col items-center text-center cursor-pointer rounded-2xl border border-white/[0.06] bg-[#0c0e18]/40 p-4 shadow-lg backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-violet-400/30 hover:bg-[#121324]/70"
                  >
                    {/* Artist Avatar Circle */}
                    <div className="relative grid size-24 place-items-center rounded-full border-2 border-white/10 bg-gradient-to-tr from-violet-600/25 via-indigo-500/15 to-purple-400/15 text-violet-200 text-2xl font-semibold shadow-inner group-hover:border-violet-400/40 transition-colors">
                      <span>{initial}</span>

                      {/* Quick Play Button (Hover) */}
                      <button
                        type="button"
                        aria-label={`Play ${artist.name}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          playArtist(artist.name, artist.tracks)
                        }}
                        className="absolute inset-0 grid place-items-center rounded-full bg-violet-400/90 text-[#090b14] shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Play className="size-5 fill-current translate-x-0.5" />
                      </button>
                    </div>

                    {/* Artist Info */}
                    <div className="mt-3.5 w-full min-w-0">
                      <h3 className="truncate text-xs font-semibold text-white/95 group-hover:text-violet-200 transition-colors">
                        {artist.name}
                      </h3>
                      <p className="text-[10px] text-white/40 font-mono mt-1">
                        {artist.tracks.length} {artist.tracks.length === 1 ? 'song' : 'songs'} •{' '}
                        {artist.albumsCount} {artist.albumsCount === 1 ? 'album' : 'albums'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating Scroll to Top button */}
      <ScrollToTopButton
        visible={showScrollTop}
        onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
      />
    </motion.div>
  )
}
