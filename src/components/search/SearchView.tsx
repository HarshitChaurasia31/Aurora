import { Album as AlbumIcon, ListMusic, Music, Search, UserRound } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { useNavigationStore } from '../../stores/navigationStore'
import { usePlayerStore } from '../../stores/playerStore'
import { usePlaylistStore } from '../../stores/playlistStore'
import { ScrollToTopButton } from '../common/ScrollToTopButton'
import { TrackRow } from '../library/TrackRow'
import type { Track } from '../../types/player'

interface SearchViewProps {
  onSelectAlbum?: (albumName: string) => void
  onSelectArtist?: (artistName: string) => void
}

export function SearchView({ onSelectAlbum, onSelectArtist }: SearchViewProps) {
  const library = usePlayerStore((state) => state.library)
  const playTrack = usePlayerStore((state) => state.playTrack)
  const playlists = usePlaylistStore((state) => state.playlists)
  const loadPlaylistDetail = usePlaylistStore((state) => state.loadPlaylistDetail)
  const setActiveTab = useNavigationStore((state) => state.setActiveTab)
  const [query, setQuery] = useState('')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const cleanQuery = query.toLowerCase().trim()

  // Matching tracks
  const matchedTracks = useMemo(() => {
    if (!cleanQuery) return []
    return library.filter(
      (t) =>
        t.title.toLowerCase().includes(cleanQuery) ||
        t.artist.toLowerCase().includes(cleanQuery) ||
        t.album.toLowerCase().includes(cleanQuery),
    )
  }, [library, cleanQuery])

  // Matching playlists
  const matchedPlaylists = useMemo(() => {
    if (!cleanQuery) return []
    return playlists.filter((p) => p.name.toLowerCase().includes(cleanQuery))
  }, [playlists, cleanQuery])

  // Matching distinct albums
  const matchedAlbums = useMemo(() => {
    if (!cleanQuery) return []
    const map = new Map<string, { name: string; artist: string; artworkUrl?: string | null; tracks: Track[] }>()

    for (const t of library) {
      if (t.album.toLowerCase().includes(cleanQuery) || t.title.toLowerCase().includes(cleanQuery)) {
        const normKey = t.album.toLowerCase().trim()
        if (!map.has(normKey)) {
          map.set(normKey, {
            name: t.album,
            artist: t.artist,
            artworkUrl: t.artworkUrl,
            tracks: [t],
          })
        } else {
          map.get(normKey)!.tracks.push(t)
        }
      }
    }
    return Array.from(map.values())
  }, [library, cleanQuery])

  // Matching distinct artists
  const matchedArtists = useMemo(() => {
    if (!cleanQuery) return []
    const map = new Map<string, { name: string; artworkUrl?: string | null; tracks: Track[] }>()

    for (const t of library) {
      if (t.artist.toLowerCase().includes(cleanQuery)) {
        const normKey = t.artist.toLowerCase().trim()
        if (!map.has(normKey)) {
          map.set(normKey, {
            name: t.artist,
            artworkUrl: t.artworkUrl,
            tracks: [t],
          })
        } else {
          map.get(normKey)!.tracks.push(t)
        }
      }
    }
    return Array.from(map.values())
  }, [library, cleanQuery])

  const handleSelectPlaylist = async (id: string) => {
    await loadPlaylistDetail(id)
    setActiveTab('Playlists')
  }

  const hasResults =
    matchedTracks.length > 0 ||
    matchedPlaylists.length > 0 ||
    matchedAlbums.length > 0 ||
    matchedArtists.length > 0

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
      className="relative z-10 mx-auto flex size-full max-w-5xl flex-col px-6 py-8 select-none"
    >
      {/* Search Input Hero */}
      <div className="relative flex items-center w-full max-w-2xl shrink-0">
        <Search className="absolute left-4 size-5 text-violet-300/70" strokeWidth={1.8} />
        <input
          type="text"
          autoFocus
          placeholder="Search by title, artist, album, or playlist..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-13 w-full rounded-2xl border border-white/[0.12] bg-[#0c0e18]/80 pl-12 pr-4 text-sm text-white placeholder-white/40 shadow-xl backdrop-blur-2xl transition-all focus:border-violet-400/50 focus:bg-[#121424] focus:outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-4 text-xs text-white/40 hover:text-white"
          >
            Clear
          </button>
        ) : null}
      </div>

      {/* Results Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="mt-8 flex-1 overflow-y-auto pr-1"
      >
        {!cleanQuery ? (
          /* Initial Empty Search State */
          <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-[#0c0e18]/30 p-8 text-center backdrop-blur-xl">
            <div className="grid size-14 place-items-center rounded-2xl border border-white/10 bg-violet-400/[0.08] text-violet-300">
              <Search className="size-7 stroke-[1.5]" />
            </div>
            <h2 className="mt-4 text-lg font-medium text-white/90">Search Music &amp; Playlists</h2>
            <p className="mt-1 max-w-sm text-xs text-white/45">
              Type to instantly search across songs, artists, albums, and playlists.
            </p>
          </div>
        ) : !hasResults ? (
          /* No Results State */
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-[#0c0e18]/20 p-8 text-center backdrop-blur-md">
            <Music className="size-8 text-white/25 stroke-[1.5]" />
            <h3 className="mt-3 text-sm font-medium text-white/80">No results found</h3>
            <p className="mt-1 text-xs text-white/40">
              No music or playlists match &quot;{query}&quot;. Check spelling or try a different term.
            </p>
          </div>
        ) : (
          <div className="space-y-8 pb-12">
            {/* Matching Playlists (if any) */}
            {matchedPlaylists.length > 0 ? (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45 mb-3 flex items-center gap-2 font-mono">
                  <ListMusic className="size-3.5 text-violet-300" />
                  Playlists
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {matchedPlaylists.map((playlist) => (
                    <button
                      key={playlist.id}
                      type="button"
                      onClick={() => handleSelectPlaylist(playlist.id)}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07] transition-all text-left cursor-pointer"
                    >
                      <div className="relative grid size-10 shrink-0 place-items-center rounded-lg overflow-hidden border border-white/10 bg-[#0c0e18] text-violet-300">
                        {playlist.artworkUrl ? (
                          <img src={playlist.artworkUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <ListMusic className="size-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white/90 group-hover:text-violet-200">
                          {playlist.name}
                        </p>
                        <p className="text-[10px] text-white/40 font-mono">
                          {playlist.trackCount} {playlist.trackCount === 1 ? 'song' : 'songs'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Matching Artists (if any) */}
            {matchedArtists.length > 0 ? (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45 mb-3 flex items-center gap-2 font-mono">
                  <UserRound className="size-3.5 text-violet-300" />
                  Artists
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {matchedArtists.map((artist) => (
                    <button
                      key={artist.name}
                      type="button"
                      onClick={() => onSelectArtist?.(artist.name)}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07] transition-all text-left cursor-pointer"
                    >
                      <div className="grid size-10 place-items-center rounded-full bg-violet-400/15 border border-violet-400/25 text-violet-200 font-medium text-sm">
                        {artist.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white/90 group-hover:text-violet-200">
                          {artist.name}
                        </p>
                        <p className="text-[10px] text-white/40">
                          {artist.tracks.length} {artist.tracks.length === 1 ? 'song' : 'songs'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Matching Albums (if any) */}
            {matchedAlbums.length > 0 ? (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45 mb-3 flex items-center gap-2 font-mono">
                  <AlbumIcon className="size-3.5 text-violet-300" />
                  Albums
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {matchedAlbums.map((album) => (
                    <button
                      key={album.name}
                      type="button"
                      onClick={() => onSelectAlbum?.(album.name)}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07] transition-all text-left cursor-pointer"
                    >
                      <div className="relative grid size-11 place-items-center rounded-lg overflow-hidden border border-white/10 bg-white/[0.04]">
                        {album.artworkUrl ? (
                          <img src={album.artworkUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <AlbumIcon className="size-5 text-violet-300/40" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white/90 group-hover:text-violet-200">
                          {album.name}
                        </p>
                        <p className="truncate text-[10px] text-white/40">{album.artist}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Matching Songs */}
            {matchedTracks.length > 0 ? (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45 mb-3 flex items-center gap-2 font-mono">
                  <Music className="size-3.5 text-violet-300" />
                  Songs ({matchedTracks.length})
                </h2>
                <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0e18]/60 backdrop-blur-xl p-1 divide-y divide-white/[0.035]">
                  {matchedTracks.map((track, idx) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      index={idx}
                      onTrackClick={(t) => playTrack(t, matchedTracks)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Floating Scroll to Top button */}
      <ScrollToTopButton visible={showScrollTop} onClick={scrollToTop} />
    </motion.div>
  )
}
