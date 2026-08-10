import { useEffect } from 'react'
import { usePlayerStore } from '../stores/playerStore'

export function useGlobalKeyboardShortcuts() {
  const togglePlay = usePlayerStore((state) => state.togglePlay)
  const next = usePlayerStore((state) => state.next)
  const previous = usePlayerStore((state) => state.previous)
  const skipForward = usePlayerStore((state) => state.skipForward)
  const skipBackward = usePlayerStore((state) => state.skipBackward)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not hijack keys if user is typing in an input, textarea, select, or contenteditable
      const target = e.target as HTMLElement | null
      if (target) {
        const tagName = target.tagName.toLowerCase()
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          target.isContentEditable
        ) {
          return
        }
      }

      // Media keys
      if (e.code === 'MediaPlayPause' || e.key === 'MediaPlayPause') {
        e.preventDefault()
        togglePlay()
        return
      }
      if (e.code === 'MediaTrackNext' || e.key === 'MediaTrackNext') {
        e.preventDefault()
        next()
        return
      }
      if (e.code === 'MediaTrackPrevious' || e.key === 'MediaTrackPrevious') {
        e.preventDefault()
        previous()
        return
      }

      // Standard desktop playback keys
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
        return
      }

      if (e.key === 'ArrowLeft' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        skipBackward(10)
        return
      }

      if (e.key === 'ArrowRight' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        skipForward(10)
        return
      }

      // J / K / L multimedia navigation
      if (e.code === 'KeyK' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        togglePlay()
        return
      }
      if (e.code === 'KeyJ' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        skipBackward(10)
        return
      }
      if (e.code === 'KeyL' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        skipForward(10)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, next, previous, skipForward, skipBackward])
}
