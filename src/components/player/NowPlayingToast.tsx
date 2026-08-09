import { Disc3, Play } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'

export function NowPlayingToast() {
  const nowPlayingToast = usePlayerStore((state) => state.nowPlayingToast)
  const setNowPlayingToast = usePlayerStore((state) => state.setNowPlayingToast)
  const [failedUrl, setFailedUrl] = useState(false)

  useEffect(() => {
    if (!nowPlayingToast) return
    setFailedUrl(false)

    const timer = setTimeout(() => {
      setNowPlayingToast(null)
    }, 2800)

    return () => clearTimeout(timer)
  }, [nowPlayingToast, setNowPlayingToast])

  if (!nowPlayingToast || !nowPlayingToast.track) return null

  const { track, timestamp } = nowPlayingToast

  return (
    <div className="pointer-events-none fixed bottom-7 left-7 z-40 select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${track.id}_${timestamp}`}
          initial={{ opacity: 0, y: 16, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3.5 rounded-2xl border border-white/[0.12] border-t-white/[0.22] bg-[#0c0e18]/90 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.65),0_0_20px_rgba(167,139,250,0.06)] backdrop-blur-2xl max-w-sm sm:max-w-md min-w-[240px]"
        >
          {/* Cover Art Frame */}
          <div className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-[#07080f] shadow-inner">
            {track.artworkUrl && !failedUrl ? (
              <img
                src={track.artworkUrl}
                alt=""
                className="size-full object-cover"
                onError={() => setFailedUrl(true)}
              />
            ) : (
              <Disc3 className="size-5 text-violet-300/60" />
            )}
          </div>

          {/* Track Identity Info */}
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-violet-300 uppercase font-mono">
              <Play className="size-2.5 fill-violet-300 translate-y-[-0.5px]" />
              <span>Now Playing</span>
            </div>
            <p className="truncate text-xs font-medium text-white/95 mt-0.5">{track.title}</p>
            <p className="truncate text-[11px] text-white/45 font-normal">{track.artist}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
