import { AnimatePresence, motion } from 'framer-motion'
import { Edit2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAmbientStore } from '../../stores/ambientStore'

export function RenameCustomMoodModal() {
  const editingMood = useAmbientStore((state) => state.editingMood)
  const close = useAmbientStore((state) => state.closeEditModal)
  const renameCustomMood = useAmbientStore((state) => state.renameCustomMood)

  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingMood) {
      setName(editingMood.name)
      setError('')
      setIsSubmitting(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [editingMood])

  if (!editingMood) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a mood name')
      return
    }
    if (trimmed === editingMood.name) {
      close()
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const success = await renameCustomMood(editingMood.id, trimmed)
      if (success) {
        close()
      } else {
        setError('Failed to rename custom mood')
      }
    } catch (err: unknown) {
      if (typeof err === 'string') {
        setError(err)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('A mood with this name already exists')
      }
    } finally {
      setIsSubmitting(false)
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
              <div className="grid size-8 place-items-center rounded-xl bg-violet-500/15 border border-violet-400/25 text-violet-300">
                <Edit2 className="size-4" />
              </div>
              <h3 className="text-lg font-medium text-white/90">Rename Custom Mood</h3>
            </div>
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
              <label htmlFor="rename-custom-mood-name" className="block text-xs font-medium text-white/60 mb-2">
                Mood Name
              </label>
              <input
                id="rename-custom-mood-name"
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError('')
                }}
                placeholder="e.g. Midnight Drive"
                maxLength={40}
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
                disabled={!name.trim() || isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500/20 border border-violet-400/30 px-5 py-2 text-xs font-medium text-violet-200 shadow-sm transition-colors hover:bg-violet-500/30 hover:border-violet-400/50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save Name'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
