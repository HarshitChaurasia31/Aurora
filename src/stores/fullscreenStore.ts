import { create } from 'zustand'
import { persistenceService } from '../services/persistenceService'

interface FullscreenState {
  isFullscreen: boolean
  toggleFullscreen: () => Promise<void>
  setFullscreen: (fullscreen: boolean) => Promise<void>
  checkFullscreen: () => Promise<void>
}

export const useFullscreenStore = create<FullscreenState>((set) => ({
  isFullscreen: false,

  toggleFullscreen: async () => {
    try {
      const next = await persistenceService.toggleFullscreen()
      set({ isFullscreen: next })
    } catch (err) {
      console.warn('[FullscreenStore] Error toggling fullscreen:', err)
    }
  },

  setFullscreen: async (fullscreen: boolean) => {
    try {
      const next = await persistenceService.setFullscreen(fullscreen)
      set({ isFullscreen: next })
    } catch (err) {
      console.warn('[FullscreenStore] Error setting fullscreen:', err)
    }
  },

  checkFullscreen: async () => {
    try {
      const isFs = await persistenceService.isFullscreen()
      set({ isFullscreen: isFs })
    } catch (err) {
      console.warn('[FullscreenStore] Error checking fullscreen:', err)
    }
  },
}))
