import { AnimatePresence, motion } from 'framer-motion'
import { memo, useEffect, useRef, useState } from 'react'
import { getAmbientVideoAsset } from '../../features/ambient/ambientAssets'
import { useAmbientStore } from '../../stores/ambientStore'
import { useSettingsStore } from '../../stores/settingsStore'

interface AmbientVideoLayerProps {
  mood: string
  src: string
  intensity: number
}

const AmbientVideoLayer = memo(function AmbientVideoLayer({ mood, src, intensity }: AmbientVideoLayerProps) {
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
      className="absolute inset-0 size-full overflow-hidden transition-opacity duration-300"
      style={{ opacity: Math.max(0.1, Math.min(1.0, intensity)) }}
      initial={{ opacity: 0 }}
      animate={{ opacity: Math.max(0.1, Math.min(1.0, intensity)) }}
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
  const customMoods = useAmbientStore((state) => state.customMoods)
  const loadCustomMoods = useAmbientStore((state) => state.loadCustomMoods)

  const ambientVideoEnabled = useSettingsStore((state) => state.settings.ambientVideoEnabled)
  const ambientIntensity = useSettingsStore((state) => state.settings.ambientIntensity)
  const loadSettings = useSettingsStore((state) => state.loadSettings)

  useEffect(() => {
    loadCustomMoods()
    loadSettings()
  }, [loadCustomMoods, loadSettings])

  const activeVideoSrc = getAmbientVideoAsset(currentMood, customMoods)
  const isVideoVisible = ambientVideoEnabled && currentMood !== 'none' && activeVideoSrc

  return (
    <div
      className="pointer-events-none absolute inset-0 select-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Video layer with crossfade transitions */}
      <AnimatePresence mode="sync">
        {isVideoVisible ? (
          <AmbientVideoLayer
            key={currentMood}
            mood={currentMood}
            src={activeVideoSrc}
            intensity={ambientIntensity}
          />
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
