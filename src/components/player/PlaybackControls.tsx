import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePlayerStore } from '../../stores/playerStore'

export function PlaybackControls() {
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const shuffle = usePlayerStore((state) => state.shuffle)
  const repeatMode = usePlayerStore((state) => state.repeatMode)
  const togglePlay = usePlayerStore((state) => state.togglePlay)
  const next = usePlayerStore((state) => state.next)
  const previous = usePlayerStore((state) => state.previous)
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle)
  const toggleRepeat = usePlayerStore((state) => state.toggleRepeat)
  const isRepeatActive = repeatMode !== 'off'

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5 select-none">
      {/* Shuffle Button */}
      <button
        type="button"
        aria-label={shuffle ? 'Disable shuffle' : 'Enable shuffle'}
        aria-pressed={shuffle}
        onClick={toggleShuffle}
        className={`relative grid size-9 place-items-center rounded-xl transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${
          shuffle
            ? 'text-violet-300 bg-violet-400/[0.16] border border-violet-400/25 shadow-[0_0_12px_rgba(167,139,250,0.25)]'
            : 'text-white/45 hover:bg-white/[0.08] hover:text-white/85 border border-transparent'
        }`}
      >
        <Shuffle className="size-4" strokeWidth={1.8} />
        {shuffle ? <span className="absolute bottom-1 size-1 rounded-full bg-violet-400" /> : null}
      </button>

      {/* Previous Track */}
      <button
        type="button"
        aria-label="Previous track"
        onClick={previous}
        className="grid size-9 place-items-center rounded-xl text-white/70 transition-all hover:bg-white/[0.08] hover:text-white active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
      >
        <SkipBack className="size-[18px]" strokeWidth={1.8} />
      </button>

      {/* Primary Play / Pause Central Button - Refined Aurora Glow */}
      <motion.button
        type="button"
        aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={togglePlay}
        className="group relative grid size-11 sm:size-11.5 place-items-center rounded-full bg-gradient-to-br from-violet-200 via-violet-300 to-indigo-300 text-[#090b14] shadow-[0_4px_22px_rgba(167,139,250,0.4),0_0_0_1px_rgba(255,255,255,0.35)] transition-all hover:shadow-[0_6px_28px_rgba(167,139,250,0.55),0_0_0_1.5px_rgba(255,255,255,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
      >
        {isPlaying ? (
          <Pause className="size-5 fill-current stroke-[2.2]" />
        ) : (
          <Play className="size-5 fill-current translate-x-0.5 stroke-[2.2]" />
        )}
      </motion.button>

      {/* Next Track */}
      <button
        type="button"
        aria-label="Next track"
        onClick={next}
        className="grid size-9 place-items-center rounded-xl text-white/70 transition-all hover:bg-white/[0.08] hover:text-white active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
      >
        <SkipForward className="size-[18px]" strokeWidth={1.8} />
      </button>

      {/* Repeat Button */}
      <button
        type="button"
        aria-label={`Repeat mode: ${repeatMode}`}
        aria-pressed={isRepeatActive}
        onClick={toggleRepeat}
        className={`relative grid size-9 place-items-center rounded-xl transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${
          isRepeatActive
            ? 'text-violet-300 bg-violet-400/[0.16] border border-violet-400/25 shadow-[0_0_12px_rgba(167,139,250,0.25)]'
            : 'text-white/45 hover:bg-white/[0.08] hover:text-white/85 border border-transparent'
        }`}
      >
        {repeatMode === 'one' ? (
          <Repeat1 className="size-4" strokeWidth={1.8} />
        ) : (
          <Repeat className="size-4" strokeWidth={1.8} />
        )}
        {isRepeatActive ? <span className="absolute bottom-1 size-1 rounded-full bg-violet-400" /> : null}
      </button>
    </div>
  )
}
