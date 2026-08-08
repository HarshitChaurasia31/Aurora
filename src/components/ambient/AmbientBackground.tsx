import { AnimatePresence, motion } from 'framer-motion'
import { memo, useEffect, useRef, useState } from 'react'
import { getAmbientVideoAsset } from '../../features/ambient/ambientAssets'
import { useAmbientStore } from '../../stores/ambientStore'
import type { AmbientMood } from '../../types/ambient'

interface AmbientVideoLayerProps {
  mood: Exclude<AmbientMood, 'none'>
  src: string
}

const AmbientVideoLayer = memo(function AmbientVideoLayer({ mood, src }: AmbientVideoLayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Ensure audio is completely muted for autoplay compliance
    video.muted = true
    video.defaultMuted = true

    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch((error: unknown) => {
        // Autoplay may be interrupted if component unmounts quickly
        if (error instanceof Error && error.name !== 'AbortError') {
          console.warn(`[AmbientBackground] Failed to autoplay ambient video (${mood}):`, error)
        }
      })
    }

    return () => {
      // Pause and release playback resources on unmount
      video.pause()
    }
  }, [mood, src])

  if (hasError) {
    return null
  }

  return (
    <motion.div
      key={mood}
      className="absolute inset-0 size-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        aria-hidden="true"
        className="size-full object-cover object-center"
        onError={(event) => {
          console.warn(`[AmbientBackground] Error loading ambient video asset for mood "${mood}":`, event)
          setHasError(true)
        }}
      />
    </motion.div>
  )
})

export function AmbientBackground() {
  const currentMood = useAmbientStore((state) => state.currentMood)
  const activeVideoSrc = getAmbientVideoAsset(currentMood)

  return (
    <div
      className="pointer-events-none absolute inset-0 select-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Video layer with crossfade transitions */}
      <AnimatePresence mode="sync">
        {currentMood !== 'none' && activeVideoSrc ? (
          <AmbientVideoLayer key={currentMood} mood={currentMood} src={activeVideoSrc} />
        ) : null}
      </AnimatePresence>

      {/* Cinematic dark translucent overlay (35% opacity) */}
      <div className="absolute inset-0 bg-[#080a12]/35" />

      {/* Soft atmospheric gradient for top depth and smooth blending */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080a12]/50 via-transparent to-[#080a12]/20" />

      {/* Subtle Aurora radial aura */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.08),transparent_60%)]" />
    </div>
  )
}
