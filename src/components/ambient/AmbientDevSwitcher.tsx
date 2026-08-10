import { motion } from 'framer-motion'
import { AMBIENT_MOOD_OPTIONS } from '../../types/ambient'
import { useAmbientStore } from '../../stores/ambientStore'
import type { AmbientMood } from '../../types/ambient'

export function AmbientDevSwitcher() {
  const currentMood = useAmbientStore((state) => state.currentMood)
  const setMood = useAmbientStore((state) => state.setMood)

  // Strictly development-only test controls; stripped from production rendering
  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <aside
      aria-label="Development Ambient Controls"
      className="absolute bottom-5 right-5 z-20 flex max-w-[calc(100vw-2.5rem)] items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-[#0d0e19]/85 p-1.5 shadow-2xl backdrop-blur-xl transition-opacity hover:opacity-100"
    >
      <span className="shrink-0 px-2 text-[10px] font-medium tracking-[0.16em] uppercase text-violet-200/50">
        Mood
      </span>
      <div className="flex shrink-0 items-center gap-1">
        {AMBIENT_MOOD_OPTIONS.map((option) => {
          const isActive = currentMood === option.id

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setMood(option.id as AmbientMood)}
              className={`relative shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${
                isActive
                  ? 'text-white'
                  : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
              }`}
            >
              {isActive ? (
                <motion.span
                  layoutId="active-dev-mood"
                  className="absolute inset-0 rounded-full bg-violet-500/25 border border-violet-400/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              ) : null}
              <span className="relative z-10">{option.label}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
