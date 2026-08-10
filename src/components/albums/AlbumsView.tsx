import { Disc3, Play } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { ScrollToTopButton } from '../common/ScrollToTopButton'
import { AlbumDetailView } from './AlbumDetailView'
import type { Track } from '../../types/player'

interface AlbumGroup {
  name: string
  artist: string
  artworkUrl?: string | null
  tracks: Track[]
}

interface AlbumsViewProps {
  initialAlbum?: string | null
  onClearInitialAlbum?: () => void
}

export function AlbumsView({ initialAlbum, onClearInitialAlbum }: AlbumsViewProps) {
  const library = usePlayerStore((state) => state.library)
  const playAlbum = usePlayerStore((state) => state.playAlbum)
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(initialAlbum || null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Derive normalized album groups
  const albums = useMemo(() => {
    const map = new Map<string, AlbumGroup>()

    for (const track of library) {
      const albumName = track.album?.trim() || 'Unknown Album'
      const normKey = albumName.toLowerCase().trim()

      if (!map.has(normKey)) {
        map.set(normKey, {
          name: albumName,
          artist: track.artist || 'Unknown Artist',
          artworkUrl: track.artworkUrl,
          tracks: [track],
        })
      } else {
        const group = map.get(normKey)!
        group.tracks.push(track)
        if (!group.artworkUrl && track.artworkUrl) {
          group.artworkUrl = track.artworkUrl
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [library])

  const handleBack = () => {
    setSelectedAlbum(null)
    onClearInitialAlbum?.()
  }

  if (selectedAlbum) {
    return <AlbumDetailView albumName={selectedAlbum} onBack={handleBack} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex size-full max-w-5xl flex-col px-6 py-8 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-6 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-medium tracking-tight text-white/90">Albums</h1>
            <span className="rounded-full bg-violet-400/[0.12] border border-violet-400/20 px-2.5 py-0.5 text-xs font-medium text-violet-300 font-mono">
              {albums.length} {albums.length === 1 ? 'album' : 'albums'}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/45">Browse your local music collection by album</p>
        </div>
      </div>

      {/* Grid Content */}
      <div
        ref={scrollRef}
        onScroll={(e) => setShowScrollTop(e.currentTarget.scrollTop > 220)}
        className="mt-6 flex-1 overflow-y-auto pr-1"
      >
        {albums.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-[#0c0e18]/30 p-8 text-center backdrop-blur-xl">
            <div className="grid size-14 place-items-center rounded-2xl border border-white/10 bg-violet-400/[0.08] text-violet-300">
              <Disc3 className="size-7 stroke-[1.5]" />
            </div>
            <h2 className="mt-4 text-lg font-medium text-white/90">No albums available</h2>
            <p className="mt-1 max-w-sm text-xs text-white/45">
              Import songs or folders with album metadata to see your albums here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 pb-12">
            <AnimatePresence>
              {albums.map((album) => (
                <div
                  key={album.name}
                  onClick={() => setSelectedAlbum(album.name)}
                  className="group relative flex flex-col cursor-pointer rounded-2xl border border-white/[0.06] bg-[#0c0e18]/40 p-3 shadow-lg backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-violet-400/30 hover:bg-[#121324]/70"
                >
                  {/* Album Cover Container */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-[#07080f]">
                    {album.artworkUrl ? (
                      <img
                        src={album.artworkUrl}
                        alt={`Cover for ${album.name}`}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-104"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-violet-300/30">
                        <Disc3 className="size-10 stroke-[1.4]" />
                      </div>
                    )}

                    {/* Quick Play Button (Hover) */}
                    <button
                      type="button"
                      aria-label={`Play album ${album.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        playAlbum(album.name, album.tracks)
                      }}
                      className="absolute bottom-2.5 right-2.5 grid size-10 place-items-center rounded-full bg-violet-300 text-[#090b14] shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105 active:scale-95"
                    >
                      <Play className="size-4 fill-current translate-x-0.5" />
                    </button>
                  </div>

                  {/* Album Info */}
                  <div className="mt-3 min-w-0">
                    <h3 className="truncate text-xs font-semibold text-white/95 group-hover:text-violet-200 transition-colors">
                      {album.name}
                    </h3>
                    <p className="truncate text-[11px] text-white/45 font-normal mt-0.5">
                      {album.artist}
                    </p>
                    <p className="text-[10px] text-white/30 font-mono mt-1">
                      {album.tracks.length} {album.tracks.length === 1 ? 'track' : 'tracks'}
                    </p>
                  </div>
                </div>
              ))}
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
