import { create } from 'zustand'
import type { AmbientMood } from '../types/ambient'

export interface AmbientStoreState {
  currentMood: AmbientMood
  setMood: (mood: AmbientMood) => void
  resetMood: () => void
}

export const useAmbientStore = create<AmbientStoreState>((set) => ({
  currentMood: 'rain',
  setMood: (mood: AmbientMood) => set({ currentMood: mood }),
  resetMood: () => set({ currentMood: 'none' }),
}))
