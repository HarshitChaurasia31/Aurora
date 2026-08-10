import { ListMusic, MoreVertical, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { usePlaylistStore } from '../../stores/playlistStore'
import { ScrollToTopButton } from '../common/ScrollToTopButton'
import { PlaylistDetailView } from './PlaylistDetailView'
import type { Playlist } from '../../types/playlist'

export function PlaylistsView() {
  const playlists = usePlaylistStore((state) => state.playlists)
  const activePlaylistDetail = usePlaylistStore((state) => state.activePlaylistDetail)
  const loadPlaylists = usePlaylistStore((state) => state.loadPlaylists)
  const loadPlaylistDetail = usePlaylistStore((state) => state.loadPlaylistDetail)
  const clearActivePlaylist = usePlaylistStore((state) => state.clearActivePlaylist)
  const openCreateModal = usePlaylistStore((state) => state.openCreateModal)
  const openRenameModal = usePlaylistStore((state) => state.openRenameModal)
  const openDeleteModal = usePlaylistStore((state) => state.openDeleteModal)

  const playTrack = usePlayerStore((state) => state.playTrack)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPlaylists()
  }, [loadPlaylists])

  if (activePlaylistDetail) {
    return (
      <PlaylistDetailView
        playlist={activePlaylistDetail}
        onBack={clearActivePlaylist}
      />
    )
  }

  const handlePlayPlaylistCard = async (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation()
    await loadPlaylistDetail(playlistId)
    const detail = usePlaylistStore.getState().activePlaylistDetail
    if (detail && detail.tracks.length > 0) {
      const playable = detail.tracks.filter((t) => !t.isMissing)
      if (playable.length > 0) {
        playTrack(playable[0], playable)
      }
    }
  }

  return (
    <div className="relative z-10 mx-auto flex size-full max-w-5xl flex-col overflow-hidden px-6 py-5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-violet-500/15 border border-violet-400/25 text-violet-300 shadow-sm">
            <ListMusic className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight text-white/95">Playlists</h1>
              <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[11px] font-mono text-white/60">
                {playlists.length}
              </span>
            </div>
            <p className="text-xs text-white/45 mt-0.5">Your personal mixes and collections</p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500/20 border border-violet-400/35 px-4 py-2 text-xs font-medium text-violet-200 shadow-sm transition-colors hover:bg-violet-500/30 hover:border-violet-400/50"
        >
          <Plus className="size-3.5" />
          <span>New Playlist</span>
        </button>
      </div>

      {/* Playlists Grid / Empty State */}
      <div
        ref={scrollRef}
        onScroll={(e) => setShowScrollTop(e.currentTarget.scrollTop > 220)}
        className="flex-1 overflow-y-auto pr-1"
      >
        {playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
            <div className="grid size-14 place-items-center rounded-2xl bg-white/[0.04] border border-white/10 text-white/30 mb-4">
              <ListMusic className="size-7" />
            </div>
            <h3 className="text-base font-medium text-white/90">No playlists yet</h3>
            <p className="text-xs text-white/45 mt-1.5 max-w-sm">
              Create custom playlists to organize your music by mood, genre, or vibe.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-violet-500/20 border border-violet-400/35 px-5 py-2.5 text-xs font-medium text-violet-200 hover:bg-violet-500/30 transition-colors shadow-sm"
            >
              <Plus className="size-4" />
              <span>Create Playlist</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-6">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onClick={() => loadPlaylistDetail(playlist.id)}
                onPlay={(e) => handlePlayPlaylistCard(e, playlist.id)}
                onRename={() => openRenameModal(playlist)}
                onDelete={() => openDeleteModal(playlist)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Scroll to Top button */}
      <ScrollToTopButton
        visible={showScrollTop}
        onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
      />
    </div>
  )
}

interface PlaylistCardProps {
  playlist: Playlist
  onClick: () => void
  onPlay: (e: React.MouseEvent) => void
  onRename: () => void
  onDelete: () => void
}

function PlaylistCard({ playlist, onClick, onPlay, onRename, onDelete }: PlaylistCardProps) {
  const [failedArt, setFailedArt] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-3.5 shadow-md backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.05] hover:shadow-xl cursor-pointer"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-[#090b14] shadow-inner flex items-center justify-center">
        {playlist.artworkUrl && !failedArt ? (
          <img
            src={playlist.artworkUrl}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setFailedArt(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-violet-300/40">
            <ListMusic className="size-10 stroke-[1.5]" />
          </div>
        )}

        {/* Hover Quick Play Button */}
        {playlist.trackCount > 0 ? (
          <button
            type="button"
            onClick={onPlay}
            aria-label={`Play ${playlist.name}`}
            className="absolute bottom-2.5 right-2.5 grid size-10 place-items-center rounded-xl bg-violet-500 text-white opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 hover:scale-105 hover:bg-violet-400"
          >
            <Play className="size-4 fill-current translate-x-0.5" />
          </button>
        ) : null}
      </div>

      {/* Playlist Meta */}
      <div className="mt-3 flex items-start justify-between gap-1 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white/90 group-hover:text-violet-200 transition-colors">
            {playlist.name}
          </p>
          <p className="truncate text-[11px] text-white/45 font-mono mt-0.5">
            {playlist.trackCount} {playlist.trackCount === 1 ? 'song' : 'songs'}
          </p>
        </div>

        {/* Menu Options Button */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            aria-label="Playlist options"
            className="grid size-6 place-items-center rounded-lg text-white/30 hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <MoreVertical className="size-3.5" />
          </button>

          {showMenu ? (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                }}
              />
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-7 z-40 w-32 rounded-xl border border-white/10 bg-[#0f111f]/95 p-1 shadow-2xl backdrop-blur-2xl text-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    onRename()
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white/70 hover:bg-white/[0.08] hover:text-white transition-colors text-left"
                >
                  <Pencil className="size-3" />
                  <span>Rename</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    onDelete()
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-300/80 hover:bg-rose-500/15 hover:text-rose-200 transition-colors text-left"
                >
                  <Trash2 className="size-3" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
