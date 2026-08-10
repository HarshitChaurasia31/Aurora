import { AnimatePresence, motion } from 'framer-motion'
import { Check, ListMusic, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { usePlaylistStore } from '../../stores/playlistStore'

export function AddToPlaylistModal() {
  const isOpen = usePlaylistStore((state) => state.isAddToPlaylistModalOpen)
  const track = usePlaylistStore((state) => state.trackToAddToPlaylist)
  const playlists = usePlaylistStore((state) => state.playlists)
  const close = usePlaylistStore((state) => state.closeAddToPlaylistModal)
  const addTrackToPlaylist = usePlaylistStore((state) => state.addTrackToPlaylist)
  const createPlaylist = usePlaylistStore((state) => state.createPlaylist)

  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')

  if (!isOpen || !track) return null

  const handleSelectPlaylist = async (playlistId: string) => {
    await addTrackToPlaylist(playlistId, track)
    close()
  }

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newPlaylistName.trim()
    if (!trimmed) return

    const newPl = await createPlaylist(trimmed)
    if (newPl) {
      await addTrackToPlaylist(newPl.id, track)
      setNewPlaylistName('')
      setIsCreatingNew(false)
      close()
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f111f]/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-lg font-medium text-white/90">Add to Playlist</h3>
              <p className="text-xs text-white/50 truncate max-w-xs mt-0.5">
                {track.title} • {track.artist}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              className="grid size-8 place-items-center rounded-lg text-white/40 hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body / Playlist List */}
          <div className="mt-4 flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[140px] max-h-[300px]">
            {playlists.length === 0 && !isCreatingNew ? (
              <div className="py-8 text-center">
                <ListMusic className="mx-auto size-8 text-white/20 mb-2" />
                <p className="text-xs text-white/45">No playlists created yet</p>
              </div>
            ) : (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  type="button"
                  onClick={() => handleSelectPlaylist(playlist.id)}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.07] hover:border-white/15 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-500/10 border border-violet-400/20 text-violet-300">
                      <ListMusic className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-white/90 group-hover:text-white">
                        {playlist.name}
                      </p>
                      <p className="text-[11px] text-white/40 font-mono">
                        {playlist.trackCount} {playlist.trackCount === 1 ? 'song' : 'songs'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-violet-300/0 group-hover:text-violet-300/80 transition-colors font-medium">
                    + Add
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Footer: Create New Playlist Inline */}
          <div className="mt-4 pt-4 border-t border-white/10 shrink-0">
            {isCreatingNew ? (
              <form onSubmit={handleCreateAndAdd} className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="New playlist name..."
                  maxLength={60}
                  className="flex-1 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-violet-400/60"
                />
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim()}
                  className="inline-flex items-center gap-1 rounded-xl bg-violet-500/20 border border-violet-400/30 px-3 py-1.5 text-xs font-medium text-violet-200 hover:bg-violet-500/30 disabled:opacity-40"
                >
                  <Check className="size-3.5" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="rounded-xl px-2.5 py-1.5 text-xs text-white/50 hover:text-white"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-2 text-xs font-medium text-white/70 hover:border-violet-400/40 hover:bg-white/[0.03] hover:text-violet-200 transition-all"
              >
                <Plus className="size-3.5" />
                <span>New Playlist</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
