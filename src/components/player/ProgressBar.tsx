import { useCallback, useRef, useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { formatTime } from '../../utils/formatTime'

export function ProgressBar() {
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)
  const seek = usePlayerStore((state) => state.seek)

  const [isDragging, setIsDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)
  const barRef = useRef<HTMLDivElement | null>(null)

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0
  const activeTime = isDragging ? dragTime : Number.isFinite(currentTime) ? currentTime : 0
  const progressPercent =
    safeDuration > 0 ? Math.min(100, Math.max(0, (activeTime / safeDuration) * 100)) : 0

  const calculateTimeFromEvent = useCallback(
    (clientX: number): number => {
      const rect = barRef.current?.getBoundingClientRect()
      if (!rect || safeDuration <= 0) return 0
      const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width))
      const ratio = offsetX / rect.width
      return ratio * safeDuration
    },
    [safeDuration],
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (safeDuration <= 0) return
    setIsDragging(true)
    const newTime = calculateTimeFromEvent(e.clientX)
    setDragTime(newTime)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const newTime = calculateTimeFromEvent(e.clientX)
    setDragTime(newTime)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const finalTime = calculateTimeFromEvent(e.clientX)
    seek(finalTime)
    setIsDragging(false)
  }

  return (
    <div className="flex w-full items-center gap-3 select-none text-xs text-white/50 font-variant-numeric-tabular">
      <span className="w-10 text-right font-medium tracking-tight text-white/60">
        {formatTime(activeTime)}
      </span>

      <div
        ref={barRef}
        role="slider"
        aria-label="Seek timeline"
        aria-valuemin={0}
        aria-valuemax={safeDuration || 100}
        aria-valuenow={activeTime}
        aria-valuetext={`${formatTime(activeTime)} of ${formatTime(safeDuration)}`}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') seek(Math.min(safeDuration, activeTime + 5))
          if (e.key === 'ArrowLeft') seek(Math.max(0, activeTime - 5))
        }}
        className="group relative flex h-6 flex-1 cursor-pointer items-center py-2 touch-none focus-visible:outline-none"
      >
        {/* Inactive Track Background with Glass Depth */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.10] border border-white/[0.06] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] transition-all group-hover:h-2">
          {/* Active Progress Fill with Aurora gradient */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-400 via-violet-300 to-violet-200 shadow-[0_0_12px_rgba(167,139,250,0.45)] transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Thumb Scrubber */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-3 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-transform scale-0 group-hover:scale-100 group-active:scale-125 focus-visible:scale-100 ring-2 ring-violet-400"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      <span className="w-10 text-left font-medium tracking-tight text-white/40">
        {formatTime(safeDuration)}
      </span>
    </div>
  )
}
