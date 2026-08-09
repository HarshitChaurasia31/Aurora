import { Disc3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { PlaybackControls } from './PlaybackControls'
import { ProgressBar } from './ProgressBar'
import { VolumeControl } from './VolumeControl'

export function GlassPlayer() {
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set())

  const title = currentTrack?.title || 'No Track Selected'
  const artist = currentTrack?.artist || 'Import a song to begin'
  const artworkUrl = currentTrack?.artworkUrl

  const showThumbnail = Boolean(artworkUrl && !failedUrls.has(artworkUrl))

  return (
    <motion.aside
      aria-label="Main music player"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
      className="relative z-10 w-[min(94vw,640px)] sm:w-[min(92vw,660px)] lg:w-[680px] xl:w-[700px] rounded-[28px] sm:rounded-[32px] border border-white/[0.12] border-t-white/[0.22] border-b-white/[0.06] bg-gradient-to-b from-white/[0.08] via-violet-950/[0.05] to-black/[0.30] p-4 sm:p-5 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.65),0_0_24px_rgba(167,139,250,0.04),inset_0_1px_1px_rgba(255,255,255,0.20),inset_0_-1px_1px_rgba(0,0,0,0.30)] backdrop-blur-3xl backdrop-saturate-150 select-none overflow-hidden"
    >
      {/* Specular glass reflection top highlight with subtle Aurora refraction */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[30px] bg-gradient-to-b from-white/[0.07] via-violet-300/[0.015] to-transparent opacity-80"
      />

      {/* Top Section: Track Info + Playback Controls + Volume */}
      <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Mini Track Identity Preview */}
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-3.5">
          {/* Glass Mini Thumbnail Frame */}
          <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-[14px] border border-white/[0.12] border-t-white/[0.18] bg-[#0c0e18] shadow-[0_4px_14px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.12)]">
            {showThumbnail ? (
              <img
                key={artworkUrl}
                src={artworkUrl!}
                alt={`Artwork for ${title}`}
                className="size-full object-contain"
                onError={() => {
                  if (artworkUrl) {
                    setFailedUrls((prev) => new Set(prev).add(artworkUrl))
                  }
                }}
              />
            ) : (
              <Disc3
                className={`size-5 text-violet-300/70 ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}
                strokeWidth={1.6}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[0.93rem] sm:text-[0.97rem] font-medium tracking-tight text-white/95">
              {title}
            </h3>
            <p className="truncate text-xs sm:text-[0.82rem] font-normal text-white/55 mt-0.5">
              {artist}
            </p>
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="shrink-0">
          <PlaybackControls />
        </div>

        {/* Right: Volume Slider */}
        <div className="hidden sm:flex flex-1 justify-end">
          <VolumeControl />
        </div>
      </div>

      {/* Bottom Section: Progress Seek Bar */}
      <div className="relative z-10 mt-3.5 pt-0.5">
        <ProgressBar />
      </div>

      {/* Mobile Volume row for narrow viewport widths */}
      <div className="relative z-10 mt-2.5 flex sm:hidden justify-end">
        <VolumeControl />
      </div>
    </motion.aside>
  )
}
