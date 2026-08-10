import { create } from 'zustand'
import { persistenceService } from '../services/persistenceService'
import { usePlayerStore } from './playerStore'
import type { Track } from '../types/player'
import type { Playlist, PlaylistDetail } from '../types/playlist'

interface PlaylistStoreState {
  playlists: Playlist[]
  activePlaylistDetail: PlaylistDetail | null
  isLoading: boolean

  // Modals
  isCreateModalOpen: boolean
  isRenameModalOpen: boolean
  playlistToRename: Playlist | null
  isDeleteModalOpen: boolean
  playlistToDelete: Playlist | null
  isAddToPlaylistModalOpen: boolean
  trackToAddToPlaylist: Track | null

  // Actions
  loadPlaylists: () => Promise<void>
  loadPlaylistDetail: (id: string) => Promise<void>
  clearActivePlaylist: () => void
  createPlaylist: (name: string) => Promise<Playlist | null>
  renamePlaylist: (id: string, name: string) => Promise<boolean>
  deletePlaylist: (id: string) => Promise<boolean>
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<boolean>
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>
  movePlaylistTrack: (playlistId: string, fromIndex: number, toIndex: number) => Promise<void>

  // Modal actions
  openCreateModal: () => void
  closeCreateModal: () => void
  openRenameModal: (playlist: Playlist) => void
  closeRenameModal: () => void
  openDeleteModal: (playlist: Playlist) => void
  closeDeleteModal: () => void
  openAddToPlaylistModal: (track: Track) => void
  closeAddToPlaylistModal: () => void
}

export const usePlaylistStore = create<PlaylistStoreState>((set, get) => ({
  playlists: [],
  activePlaylistDetail: null,
  isLoading: false,

  isCreateModalOpen: false,
  isRenameModalOpen: false,
  playlistToRename: null,
  isDeleteModalOpen: false,
  playlistToDelete: null,
  isAddToPlaylistModalOpen: false,
  trackToAddToPlaylist: null,

  loadPlaylists: async () => {
    set({ isLoading: true })
    try {
      const playlists = await persistenceService.getAllPlaylists()
      set({ playlists, isLoading: false })
    } catch (err) {
      console.error('[PlaylistStore] Error loading playlists:', err)
      set({ isLoading: false })
    }
  },

  loadPlaylistDetail: async (id: string) => {
    try {
      const detail = await persistenceService.getPlaylistDetail(id)
      set({ activePlaylistDetail: detail })
    } catch (err) {
      console.error('[PlaylistStore] Error loading playlist detail:', err)
      set({ activePlaylistDetail: null })
    }
  },

  clearActivePlaylist: () => set({ activePlaylistDetail: null }),

  createPlaylist: async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return null

    try {
      const newPlaylist = await persistenceService.createPlaylist(trimmed)
      if (newPlaylist) {
        set((state) => ({
          playlists: [newPlaylist, ...state.playlists],
        }))
        usePlayerStore.getState().setImportNotification({
          message: `Playlist "${trimmed}" created`,
          timestamp: Date.now(),
        })
        return newPlaylist
      }
      return null
    } catch (err) {
      console.error('[PlaylistStore] Error creating playlist:', err)
      return null
    }
  },

  renamePlaylist: async (id: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return false

    try {
      const success = await persistenceService.renamePlaylist(id, trimmed)
      if (success) {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === id ? { ...p, name: trimmed, updatedAt: Date.now() } : p,
          ),
          activePlaylistDetail:
            state.activePlaylistDetail?.id === id
              ? { ...state.activePlaylistDetail, name: trimmed, updatedAt: Date.now() }
              : state.activePlaylistDetail,
        }))
        usePlayerStore.getState().setImportNotification({
          message: `Renamed to "${trimmed}"`,
          timestamp: Date.now(),
        })
        return true
      }
      return false
    } catch (err) {
      console.error('[PlaylistStore] Error renaming playlist:', err)
      return false
    }
  },

  deletePlaylist: async (id: string) => {
    const target = get().playlists.find((p) => p.id === id)
    try {
      const success = await persistenceService.deletePlaylist(id)
      if (success) {
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== id),
          activePlaylistDetail:
            state.activePlaylistDetail?.id === id ? null : state.activePlaylistDetail,
        }))
        usePlayerStore.getState().setImportNotification({
          message: target ? `Deleted playlist "${target.name}"` : 'Playlist deleted',
          timestamp: Date.now(),
        })
        return true
      }
      return false
    } catch (err) {
      console.error('[PlaylistStore] Error deleting playlist:', err)
      return false
    }
  },

  addTrackToPlaylist: async (playlistId: string, track: Track) => {
    try {
      const added = await persistenceService.addTrackToPlaylist(playlistId, track.id)
      if (added) {
        // Refresh playlists and active playlist
        await get().loadPlaylists()
        if (get().activePlaylistDetail?.id === playlistId) {
          await get().loadPlaylistDetail(playlistId)
        }
        const targetPlaylist = get().playlists.find((p) => p.id === playlistId)
        usePlayerStore.getState().setImportNotification({
          message: `Added "${track.title}" to ${targetPlaylist?.name || 'playlist'}`,
          timestamp: Date.now(),
        })
        return true
      } else {
        // Already in playlist
        const targetPlaylist = get().playlists.find((p) => p.id === playlistId)
        usePlayerStore.getState().setImportNotification({
          message: `"${track.title}" is already in ${targetPlaylist?.name || 'this playlist'}`,
          timestamp: Date.now(),
        })
        return false
      }
    } catch (err) {
      console.error('[PlaylistStore] Error adding track to playlist:', err)
      return false
    }
  },

  removeTrackFromPlaylist: async (playlistId: string, trackId: string) => {
    try {
      await persistenceService.removeTrackFromPlaylist(playlistId, trackId)
      // Update active detail immediately
      set((state) => {
        if (state.activePlaylistDetail?.id === playlistId) {
          const updatedTracks = state.activePlaylistDetail.tracks.filter((t) => t.id !== trackId)
          const firstWithArt = updatedTracks.find((t) => Boolean(t.artworkUrl))
          return {
            activePlaylistDetail: {
              ...state.activePlaylistDetail,
              trackCount: updatedTracks.length,
              artworkUrl: firstWithArt?.artworkUrl || null,
              tracks: updatedTracks,
            },
          }
        }
        return state
      })
      await get().loadPlaylists()
    } catch (err) {
      console.error('[PlaylistStore] Error removing track from playlist:', err)
    }
  },

  movePlaylistTrack: async (playlistId: string, fromIndex: number, toIndex: number) => {
    const detail = get().activePlaylistDetail
    if (
      !detail ||
      detail.id !== playlistId ||
      fromIndex < 0 ||
      fromIndex >= detail.tracks.length ||
      toIndex < 0 ||
      toIndex >= detail.tracks.length ||
      fromIndex === toIndex
    ) {
      return
    }

    const updatedTracks = [...detail.tracks]
    const [moved] = updatedTracks.splice(fromIndex, 1)
    updatedTracks.splice(toIndex, 0, moved)

    const firstWithArt = updatedTracks.find((t) => Boolean(t.artworkUrl))

    set({
      activePlaylistDetail: {
        ...detail,
        artworkUrl: firstWithArt?.artworkUrl || null,
        tracks: updatedTracks,
      },
    })

    const trackIds = updatedTracks.map((t) => t.id)
    await persistenceService.reorderPlaylistTracks(playlistId, trackIds)
    await get().loadPlaylists()
  },

  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),

  openRenameModal: (playlist) => set({ isRenameModalOpen: true, playlistToRename: playlist }),
  closeRenameModal: () => set({ isRenameModalOpen: false, playlistToRename: null }),

  openDeleteModal: (playlist) => set({ isDeleteModalOpen: true, playlistToDelete: playlist }),
  closeDeleteModal: () => set({ isDeleteModalOpen: false, playlistToDelete: null }),

  openAddToPlaylistModal: (track) =>
    set({ isAddToPlaylistModalOpen: true, trackToAddToPlaylist: track }),
  closeAddToPlaylistModal: () =>
    set({ isAddToPlaylistModalOpen: false, trackToAddToPlaylist: null }),
}))
