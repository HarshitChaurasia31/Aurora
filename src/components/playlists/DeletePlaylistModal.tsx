import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { usePlaylistStore } from '../../stores/playlistStore'

export function DeletePlaylistModal() {
  const isOpen = usePlaylistStore((state) => state.isDeleteModalOpen)
  const playlist = usePlaylistStore((state) => state.playlistToDelete)
  const close = usePlaylistStore((state) => state.closeDeleteModal)
  const deletePlaylist = usePlaylistStore((state) => state.deletePlaylist)

  if (!isOpen || !playlist) return null

  const handleDelete = async () => {
    await deletePlaylist(playlist.id)
    close()
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
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f111f]/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="size-5" />
              <h3 className="text-lg font-medium text-white/90">Delete Playlist</h3>
            </div>
            <button
              type="button"
              onClick={close}
              className="grid size-8 place-items-center rounded-lg text-white/40 hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-4">
            <p className="text-sm text-white/80 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">&quot;{playlist.name}&quot;</span>?
            </p>
            <p className="mt-2 text-xs text-white/45 leading-relaxed">
              This removes the playlist and its organization, but keeps all audio files and songs in your library untouched.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-6">
            <button
              type="button"
              onClick={close}
              className="rounded-xl px-4 py-2 text-xs font-medium text-white/60 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 px-5 py-2 text-xs font-medium text-rose-200 shadow-sm transition-colors hover:bg-rose-500/30 hover:border-rose-500/50"
            >
              <Trash2 className="size-3.5" />
              Delete Playlist
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
