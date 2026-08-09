import { motion } from 'framer-motion'
import { Disc3 } from 'lucide-react'
import { useState } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import type { SongMetadata } from '../../types/player'

interface AlbumArtworkProps {
  song?: SongMetadata | null
  className?: string
}

export function AlbumArtwork({ song, className = '' }: AlbumArtworkProps) {
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set())
  const storeTrack = usePlayerStore((state) => state.currentTrack)

  const activeSong = song !== undefined ? song : storeTrack
  const title = activeSong?.title || 'No Track Playing'
  const artist = activeSong?.artist || 'Aurora Local Music'
  const artworkUrl = activeSong?.artworkUrl

  const showFallback = !artworkUrl || failedUrls.has(artworkUrl)

  return (
    <motion.div
      className={`flex flex-col items-center select-none ${className}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Responsive 1:1 perfect square artwork region (350-385px desktop, 310-345px smaller desktop, max ~335px mobile) */}
      <div className="relative aspect-square w-[min(80vw,310px)] sm:w-[min(58vw,335px)] md:w-[345px] lg:w-[365px] xl:w-[375px] 2xl:w-[385px] max-h-[42vh] flex items-center justify-center bg-transparent">
        {showFallback ? (
          /* Tasteful fallback placeholder state when no track/artwork exists */
          <div
            className="flex size-full flex-col items-center justify-center rounded-2xl lg:rounded-[22px] border border-white/[0.12] bg-gradient-to-br from-[#141224] via-[#0c0e18] to-[#080911] p-6 text-center text-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
            role="img"
            aria-label={`Artwork placeholder for ${title} by ${artist}`}
          >
            <div className="grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-violet-300/60 shadow-inner">
              <Disc3 className="size-7 stroke-[1.4]" />
            </div>
            <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.2em] text-violet-200/40">
              Aurora Audio
            </p>
          </div>
        ) : (
          /* Complete uncropped original artwork with transparent background so ambient video is visible */
          <img
            key={artworkUrl}
            src={artworkUrl}
            alt={`Album artwork for ${title} by ${artist}`}
            className="size-full object-contain object-center rounded-2xl lg:rounded-[22px] bg-transparent transition-opacity duration-500 drop-shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
            loading="eager"
            decoding="async"
            onError={() => {
              if (artworkUrl) {
                setFailedUrls((prev) => new Set(prev).add(artworkUrl))
              }
            }}
          />
        )}
      </div>

      {/* Subordinate Song Identity */}
      <div className="mt-3 lg:mt-3.5 text-center max-w-[min(80vw,310px)] sm:max-w-[min(58vw,335px)] md:max-w-[345px] lg:max-w-[365px] xl:max-w-[375px] 2xl:max-w-[385px]">
        <h2 className="text-[1.1rem] lg:text-[1.2rem] font-medium tracking-tight text-white/90 truncate">
          {title}
        </h2>
        <p className="mt-0.5 text-xs lg:text-[0.84rem] text-white/50 truncate font-normal">
          {artist}
        </p>
      </div>
    </motion.div>
  )
}
