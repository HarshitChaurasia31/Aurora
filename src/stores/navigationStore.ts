import { create } from 'zustand'
import type { NavigationTab } from '../types/navigation'

interface NavigationState {
  activeTab: NavigationTab
  setActiveTab: (tab: NavigationTab) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeTab: 'Home',
  setActiveTab: (tab: NavigationTab) => set({ activeTab: tab }),
}))
