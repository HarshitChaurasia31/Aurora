import { AnimatePresence, motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePlaylistStore } from '../../stores/playlistStore'

export function RenamePlaylistModal() {
  const isOpen = usePlaylistStore((state) => state.isRenameModalOpen)
  const playlist = usePlaylistStore((state) => state.playlistToRename)
  const close = usePlaylistStore((state) => state.closeRenameModal)
  const renamePlaylist = usePlaylistStore((state) => state.renamePlaylist)

  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && playlist) {
      setName(playlist.name)
      setError('')
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [isOpen, playlist])

  if (!isOpen || !playlist) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a playlist name')
      return
    }
    const ok = await renamePlaylist(playlist.id, trimmed)
    if (ok) {
      close()
    } else {
      setError('Failed to rename playlist')
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
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f111f]/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white/90">Rename Playlist</h3>
            <button
              type="button"
              onClick={close}
              className="grid size-8 place-items-center rounded-lg text-white/40 hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="rename-playlist-name" className="block text-xs font-medium text-white/60 mb-2">
                New Name
              </label>
              <input
                id="rename-playlist-name"
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError('')
                }}
                maxLength={60}
                className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-violet-400/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-violet-400/20 transition-all"
              />
              {error ? <p className="mt-1.5 text-xs text-rose-400">{error}</p> : null}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={close}
                className="rounded-xl px-4 py-2 text-xs font-medium text-white/60 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || name.trim() === playlist.name}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500/20 border border-violet-400/30 px-5 py-2 text-xs font-medium text-violet-200 shadow-sm transition-colors hover:bg-violet-500/30 hover:border-violet-400/50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check className="size-3.5" />
                Save
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
