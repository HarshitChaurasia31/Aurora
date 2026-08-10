import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useAmbientStore } from '../../stores/ambientStore'

export function DeleteCustomMoodModal() {
  const deletingMood = useAmbientStore((state) => state.deletingMood)
  const close = useAmbientStore((state) => state.closeDeleteModal)
  const deleteCustomMood = useAmbientStore((state) => state.deleteCustomMood)

  const [isDeleting, setIsDeleting] = useState(false)

  if (!deletingMood) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteCustomMood(deletingMood.id)
      close()
    } catch (err) {
      console.error('Failed to delete custom mood:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f111f]/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-xl bg-rose-500/15 border border-rose-400/25 text-rose-300">
                <Trash2 className="size-4" />
              </div>
              <h3 className="text-lg font-medium text-white/90">Delete Custom Mood</h3>
            </div>
            <button
              type="button"
              onClick={close}
              className="grid size-8 place-items-center rounded-lg text-white/40 hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-sm text-white/70">
              Are you sure you want to delete <span className="font-semibold text-white">"{deletingMood.name}"</span>?
            </p>
            <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60">
              <AlertTriangle className="size-4 shrink-0 text-amber-400 mt-0.5" />
              <p>
                This removes the custom mood from Aurora. Your local video file will <span className="font-medium text-white/90">NOT</span> be deleted from your computer.
              </p>
            </div>
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
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-400/30 px-5 py-2 text-xs font-medium text-rose-200 shadow-sm transition-colors hover:bg-rose-500/30 hover:border-rose-400/50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="size-3.5" />
              {isDeleting ? 'Deleting...' : 'Delete Mood'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
