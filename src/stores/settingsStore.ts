import { create } from 'zustand'
import { persistenceService } from '../services/persistenceService'
import type { AppSettings, StorageStats } from '../types/settings'

export interface SettingsStoreState {
  settings: AppSettings
  stats: StorageStats | null
  isLoading: boolean
  isRescanning: boolean
  rescanMessage: string | null
  isResetModalOpen: boolean

  // Actions
  loadSettings: () => Promise<void>
  loadStats: () => Promise<void>
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
  pickAndSetMusicFolder: () => Promise<string | null>
  openResetModal: () => void
  closeResetModal: () => void
  resetSettings: () => Promise<void>
}

const DEFAULT_SETTINGS: AppSettings = {
  startWithLastMood: true,
  resumePlayerState: false,
  autoplayOnImport: true,
  defaultVolume: 1.0,
  ambientVideoEnabled: true,
  ambientIntensity: 1.0,
  musicDirectory: 'D:\\Music',
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  stats: null,
  isLoading: false,
  isRescanning: false,
  rescanMessage: null,
  isResetModalOpen: false,

  loadSettings: async () => {
    set({ isLoading: true })
    try {
      const settings = await persistenceService.getAppSettings()
      set({ settings, isLoading: false })
    } catch (err) {
      console.error('[SettingsStore] Failed to load settings:', err)
      set({ isLoading: false })
    }
  },

  loadStats: async () => {
    try {
      const stats = await persistenceService.getStorageStats()
      if (stats) {
        set({ stats })
      }
    } catch (err) {
      console.error('[SettingsStore] Failed to load storage stats:', err)
    }
  },

  updateSetting: async (key, value) => {
    const prev = get().settings
    const updated = { ...prev, [key]: value }
    set({ settings: updated })
    try {
      await persistenceService.updateAppSettings(updated)
    } catch (err) {
      console.error(`[SettingsStore] Failed to update setting ${String(key)}:`, err)
      // Revert on failure
      set({ settings: prev })
    }
  },

  pickAndSetMusicFolder: async () => {
    try {
      const folder = await persistenceService.pickMusicFolder()
      if (folder) {
        await get().updateSetting('musicDirectory', folder)
        return folder
      }
    } catch (err) {
      console.error('[SettingsStore] Failed to pick music folder:', err)
    }
    return null
  },

  openResetModal: () => set({ isResetModalOpen: true }),
  closeResetModal: () => set({ isResetModalOpen: false }),

  resetSettings: async () => {
    try {
      const reset = await persistenceService.resetAppSettings()
      if (reset) {
        set({ settings: reset, isResetModalOpen: false })
      }
    } catch (err) {
      console.error('[SettingsStore] Failed to reset settings:', err)
    }
  },
}))
