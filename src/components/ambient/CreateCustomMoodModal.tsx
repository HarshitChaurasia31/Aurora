import { AnimatePresence, motion } from 'framer-motion'
import { FileVideo, Plus, Video, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { persistenceService } from '../../services/persistenceService'
import { useAmbientStore } from '../../stores/ambientStore'

export function CreateCustomMoodModal() {
  const isOpen = useAmbientStore((state) => state.isCreateModalOpen)
  const close = useAmbientStore((state) => state.closeCreateModal)
  const createCustomMood = useAmbientStore((state) => state.createCustomMood)

  const [name, setName] = useState('')
  const [videoPath, setVideoPath] = useState('')
  const [error, setError] = useState('')
  const [isPicking, setIsPicking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setVideoPath('')
      setError('')
      setIsSubmitting(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handlePickVideo = async () => {
    setIsPicking(true)
    setError('')
    try {
      const selectedPath = await persistenceService.pickAmbientVideo()
      if (selectedPath) {
        setVideoPath(selectedPath)
        // If name is empty, auto-populate from file name
        if (!name.trim()) {
          const fileName = selectedPath.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') ?? ''
          if (fileName) {
            setName(fileName.charAt(0).toUpperCase() + fileName.slice(1))
          }
        }
      }
    } catch (err) {
      console.error('Failed to pick ambient video:', err)
      setError('Failed to select video file')
    } finally {
      setIsPicking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedPath = videoPath.trim()

    if (!trimmedName) {
      setError('Please enter a mood name')
      return
    }
    if (!trimmedPath) {
      setError('Please select a local video file')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const created = await createCustomMood(trimmedName, trimmedPath)
      if (created) {
        close()
      } else {
        setError('Failed to create custom mood')
      }
    } catch (err: unknown) {
      if (typeof err === 'string') {
        setError(err)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to create custom mood. A mood with this name may already exist.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const fileName = videoPath ? videoPath.split(/[/\\]/).pop() : null

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
                <Video className="size-4" />
              </div>
              <h3 className="text-lg font-medium text-white/90">Create Custom Mood</h3>
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
              <label htmlFor="custom-mood-name" className="block text-xs font-medium text-white/60 mb-2">
                Mood Name
              </label>
              <input
                id="custom-mood-name"
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
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">
                Background Video (.mp4, .webm, .mov)
              </label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handlePickVideo}
                  disabled={isPicking}
                  className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-4 py-3 text-xs font-medium text-white/70 hover:border-violet-400/40 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <FileVideo className="size-4 text-violet-300" />
                  {isPicking ? 'Selecting...' : videoPath ? 'Change Video' : 'Choose Local Video'}
                </button>

                {videoPath ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                    <p className="text-xs font-medium text-white/90 truncate">{fileName}</p>
                    <p className="text-[11px] text-white/40 truncate mt-0.5" title={videoPath}>
                      {videoPath}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {error ? <p className="text-xs text-rose-400">{error}</p> : null}

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
                disabled={!name.trim() || !videoPath.trim() || isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500/20 border border-violet-400/30 px-5 py-2 text-xs font-medium text-violet-200 shadow-sm transition-colors hover:bg-violet-500/30 hover:border-violet-400/50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="size-3.5" />
                {isSubmitting ? 'Creating...' : 'Create Mood'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
