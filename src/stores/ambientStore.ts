import { create } from 'zustand'
import { persistenceService } from '../services/persistenceService'
import type { AmbientMood, CustomMood } from '../types/ambient'

const STORAGE_KEY_MOOD = 'aurora_ambient_mood'

export interface AmbientStoreState {
  currentMood: AmbientMood
  customMoods: CustomMood[]
  isLoading: boolean
  isCreateModalOpen: boolean
  editingMood: CustomMood | null
  deletingMood: CustomMood | null
  relinkingMood: CustomMood | null

  // Actions
  loadCustomMoods: () => Promise<void>
  setMood: (mood: AmbientMood) => void
  resetMood: () => void
  openCreateModal: () => void
  closeCreateModal: () => void
  openEditModal: (mood: CustomMood) => void
  closeEditModal: () => void
  openDeleteModal: (mood: CustomMood) => void
  closeDeleteModal: () => void
  openRelinkModal: (mood: CustomMood) => void
  closeRelinkModal: () => void

  createCustomMood: (name: string, videoPath: string) => Promise<CustomMood | null>
  renameCustomMood: (id: string, name: string) => Promise<boolean>
  updateCustomMoodVideo: (id: string, videoPath: string) => Promise<boolean>
  deleteCustomMood: (id: string) => Promise<boolean>
}

const getInitialMood = (): AmbientMood => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MOOD)
    if (saved) return saved as AmbientMood
  } catch {
    // LocalStorage fallback
  }
  return 'rain'
}

export const useAmbientStore = create<AmbientStoreState>((set, get) => ({
  currentMood: getInitialMood(),
  customMoods: [],
  isLoading: false,
  isCreateModalOpen: false,
  editingMood: null,
  deletingMood: null,
  relinkingMood: null,

  loadCustomMoods: async () => {
    set({ isLoading: true })
    try {
      const moods = await persistenceService.getAllCustomMoods()
      set({ customMoods: moods, isLoading: false })

      // Check current mood validity
      const current = get().currentMood
      if (current.startsWith('custom_mood_')) {
        const found = moods.find((m) => m.id === current)
        if (!found) {
          // If custom mood was deleted outside, fall back to rain
          get().setMood('rain')
        }
      }
    } catch (err) {
      console.error('[AmbientStore] Failed to load custom moods:', err)
      set({ isLoading: false })
    }
  },

  setMood: (mood: AmbientMood) => {
    try {
      localStorage.setItem(STORAGE_KEY_MOOD, mood)
    } catch {
      // LocalStorage fallback
    }
    set({ currentMood: mood })
  },

  resetMood: () => {
    get().setMood('none')
  },

  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),

  openEditModal: (mood: CustomMood) => set({ editingMood: mood }),
  closeEditModal: () => set({ editingMood: null }),

  openDeleteModal: (mood: CustomMood) => set({ deletingMood: mood }),
  closeDeleteModal: () => set({ deletingMood: null }),

  openRelinkModal: (mood: CustomMood) => set({ relinkingMood: mood }),
  closeRelinkModal: () => set({ relinkingMood: null }),

  createCustomMood: async (name: string, videoPath: string) => {
    const created = await persistenceService.createCustomMood(name, videoPath)
    if (created) {
      set((state) => ({
        customMoods: [...state.customMoods, created],
        isCreateModalOpen: false,
      }))
      get().setMood(created.id)
    }
    return created
  },

  renameCustomMood: async (id: string, name: string) => {
    const success = await persistenceService.renameCustomMood(id, name)
    if (success) {
      set((state) => ({
        customMoods: state.customMoods.map((m) =>
          m.id === id ? { ...m, name: name.trim(), updatedAt: Date.now() } : m,
        ),
        editingMood: null,
      }))
    }
    return success
  },

  updateCustomMoodVideo: async (id: string, videoPath: string) => {
    const success = await persistenceService.updateCustomMoodVideo(id, videoPath)
    if (success) {
      set((state) => ({
        customMoods: state.customMoods.map((m) =>
          m.id === id ? { ...m, videoPath: videoPath.trim(), isMissing: false, updatedAt: Date.now() } : m,
        ),
        relinkingMood: null,
      }))
    }
    return success
  },

  deleteCustomMood: async (id: string) => {
    const success = await persistenceService.deleteCustomMood(id)
    if (success) {
      set((state) => {
        const remaining = state.customMoods.filter((m) => m.id !== id)
        return {
          customMoods: remaining,
          deletingMood: null,
        }
      })
      // If deleted mood was currently active, fall back to rain
      if (get().currentMood === id) {
        get().setMood('rain')
      }
    }
    return success
  },
}))
