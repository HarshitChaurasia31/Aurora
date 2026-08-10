import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, FileVideo, Video, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { persistenceService } from '../../services/persistenceService'
import { useAmbientStore } from '../../stores/ambientStore'

export function RelinkCustomMoodModal() {
  const relinkingMood = useAmbientStore((state) => state.relinkingMood)
  const close = useAmbientStore((state) => state.closeRelinkModal)
  const updateCustomMoodVideo = useAmbientStore((state) => state.updateCustomMoodVideo)

  const [newVideoPath, setNewVideoPath] = useState('')
  const [error, setError] = useState('')
  const [isPicking, setIsPicking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (relinkingMood) {
      setNewVideoPath('')
      setError('')
      setIsSubmitting(false)
    }
  }, [relinkingMood])

  if (!relinkingMood) return null

  const handlePickVideo = async () => {
    setIsPicking(true)
    setError('')
    try {
      const selectedPath = await persistenceService.pickAmbientVideo()
      if (selectedPath) {
        setNewVideoPath(selectedPath)
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
    const trimmed = newVideoPath.trim()
    if (!trimmed) {
      setError('Please select a new video file')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const success = await updateCustomMoodVideo(relinkingMood.id, trimmed)
      if (success) {
        close()
      } else {
        setError('Failed to update custom mood video')
      }
    } catch (err: unknown) {
      if (typeof err === 'string') {
        setError(err)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to update video path')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentFileName = relinkingMood.videoPath.split(/[/\\]/).pop()
  const newFileName = newVideoPath ? newVideoPath.split(/[/\\]/).pop() : null

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
              <div>
                <h3 className="text-lg font-medium text-white/90">Change / Relink Video</h3>
                <p className="text-xs text-white/50">{relinkingMood.name}</p>
              </div>
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
            {relinkingMood.isMissing ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-200">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium">Video File Not Found</p>
                  <p className="text-amber-200/70 mt-0.5 text-[11px]">
                    The video file at <span className="font-mono text-amber-100">{currentFileName}</span> could not be found. Select a new location to restore this mood.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs font-medium text-white/50">Current Path</p>
                <p className="text-xs font-mono text-white/80 truncate mt-1" title={relinkingMood.videoPath}>
                  {relinkingMood.videoPath}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">
                New Video File (.mp4, .webm, .mov)
              </label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handlePickVideo}
                  disabled={isPicking}
                  className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-4 py-3 text-xs font-medium text-white/70 hover:border-violet-400/40 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <FileVideo className="size-4 text-violet-300" />
                  {isPicking ? 'Selecting...' : newVideoPath ? 'Choose Different Video' : 'Choose Local Video'}
                </button>

                {newVideoPath ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                    <p className="text-xs font-medium text-white/90 truncate">{newFileName}</p>
                    <p className="text-[11px] text-white/40 truncate mt-0.5" title={newVideoPath}>
                      {newVideoPath}
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
                disabled={!newVideoPath.trim() || isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500/20 border border-violet-400/30 px-5 py-2 text-xs font-medium text-violet-200 shadow-sm transition-colors hover:bg-violet-500/30 hover:border-violet-400/50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Relinking...' : 'Relink Video'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
