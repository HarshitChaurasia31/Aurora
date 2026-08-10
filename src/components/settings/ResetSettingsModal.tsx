import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'

export function ResetSettingsModal() {
  const isOpen = useSettingsStore((state) => state.isResetModalOpen)
  const close = useSettingsStore((state) => state.closeResetModal)
  const resetSettings = useSettingsStore((state) => state.resetSettings)

  const [isResetting, setIsResetting] = useState(false)

  if (!isOpen) return null

  const handleReset = async () => {
    setIsResetting(true)
    try {
      await resetSettings()
      close()
    } catch (err) {
      console.error('Failed to reset settings:', err)
    } finally {
      setIsResetting(false)
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
              <div className="grid size-8 place-items-center rounded-xl bg-amber-500/15 border border-amber-400/25 text-amber-300">
                <RotateCcw className="size-4" />
              </div>
              <h3 className="text-lg font-medium text-white/90">Reset Preferences</h3>
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
              Are you sure you want to reset all preferences to their default values?
            </p>
            <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60">
              <AlertTriangle className="size-4 shrink-0 text-amber-400 mt-0.5" />
              <p>
                This resets application settings (volume, ambient intensity, toggles). Your music library, tracks, playlists, and custom moods will <span className="font-medium text-white/90">NOT</span> be deleted or modified.
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
              onClick={handleReset}
              disabled={isResetting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30 px-5 py-2 text-xs font-medium text-amber-200 shadow-sm transition-colors hover:bg-amber-500/30 hover:border-amber-400/50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="size-3.5" />
              {isResetting ? 'Resetting...' : 'Reset to Defaults'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
