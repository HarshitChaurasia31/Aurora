import { Volume1, Volume2, VolumeX } from 'lucide-react'
import { useCallback, useRef } from 'react'
import { usePlayerStore } from '../../stores/playerStore'

export function VolumeControl() {
  const volume = usePlayerStore((state) => state.volume)
  const isMuted = usePlayerStore((state) => state.isMuted)
  const setVolume = usePlayerStore((state) => state.setVolume)
  const toggleMute = usePlayerStore((state) => state.toggleMute)

  const sliderRef = useRef<HTMLDivElement | null>(null)
  const effectiveVolume = isMuted ? 0 : volume

  const handlePointerChange = useCallback(
    (clientX: number) => {
      const rect = sliderRef.current?.getBoundingClientRect()
      if (!rect) return
      const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width))
      const ratio = offsetX / rect.width
      setVolume(ratio)
    },
    [setVolume],
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    handlePointerChange(e.clientX)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 1) {
      handlePointerChange(e.clientX)
    }
  }

  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2

  return (
    <div className="flex items-center gap-2 select-none">
      <button
        type="button"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        onClick={toggleMute}
        className="grid size-8 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
      >
        <VolumeIcon className="size-4" strokeWidth={1.8} />
      </button>

      <div
        ref={sliderRef}
        role="slider"
        aria-label="Volume level"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(effectiveVolume * 100)}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setVolume(Math.min(1, volume + 0.05))
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setVolume(Math.max(0, volume - 0.05))
        }}
        className="group relative flex h-6 w-20 sm:w-24 cursor-pointer items-center py-2 touch-none focus-visible:outline-none"
      >
        {/* Track */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.10] border border-white/[0.06] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] transition-all group-hover:h-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-300 to-violet-200 shadow-[0_0_8px_rgba(167,139,250,0.35)]"
            style={{ width: `${Math.round(effectiveVolume * 100)}%` }}
          />
        </div>

        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-2.5 rounded-full bg-white shadow-sm transition-transform scale-0 group-hover:scale-100 group-active:scale-125 focus-visible:scale-100 ring-2 ring-violet-400"
          style={{ left: `${Math.round(effectiveVolume * 100)}%` }}
        />
      </div>
    </div>
  )
}
