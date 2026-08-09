import { create } from 'zustand'
import { audioEngine } from '../features/audio/audioEngine'
import { persistenceService } from '../services/persistenceService'
import type { RepeatMode, Track } from '../types/player'

interface PlayerStoreState {
  library: Track[]
  queue: Track[]
  currentIndex: number
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  previousVolume: number
  shuffle: boolean
  repeatMode: RepeatMode
  searchQuery: string
  isInitialized: boolean

  // Actions
  initializeLibrary: () => Promise<void>
  addTracks: (tracks: Track[], autoPlayFirst?: boolean) => void
  playTrack: (track: Track, customQueue?: Track[]) => void
  togglePlay: () => void
  play: () => void
  pause: () => void
  next: () => void
  previous: () => void
  seek: (seconds: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  toggleLike: (trackId?: string) => void
  handleTrackEnded: () => void
  setCurrentTime: (currentTime: number) => void
  setDuration: (duration: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  setSearchQuery: (query: string) => void
}

export const usePlayerStore = create<PlayerStoreState>((set, get) => ({
  library: [],
  queue: [],
  currentIndex: -1,
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.85,
  isMuted: false,
  previousVolume: 0.85,
  shuffle: false,
  repeatMode: 'off',
  searchQuery: '',
  isInitialized: false,

  initializeLibrary: async () => {
    if (get().isInitialized) return
    set({ isInitialized: true })

    try {
      const persistedTracks = await persistenceService.loadPersistedLibrary()
      if (persistedTracks.length > 0) {
        set({
          library: persistedTracks,
          queue: persistedTracks,
          currentTrack: persistedTracks[0],
          currentIndex: 0,
          duration: persistedTracks[0].duration || 0,
        })
      }
    } catch (err) {
      console.warn('[PlayerStore] Error during initializeLibrary:', err)
    }
  },

  addTracks: (newTracks: Track[], autoPlayFirst = false) => {
    if (!newTracks || newTracks.length === 0) return

    const currentLib = get().library
    const updatedLibrary = [...currentLib]
    const trulyNewTracks: Track[] = []

    for (const track of newTracks) {
      const existingIndex = updatedLibrary.findIndex(
        (t) =>
          t.id === track.id ||
          t.filePath === track.filePath ||
          (t.fileHash && track.fileHash && t.fileHash === track.fileHash),
      )

      if (existingIndex >= 0) {
        // Reconcile moved/existing track in-place
        updatedLibrary[existingIndex] = {
          ...updatedLibrary[existingIndex],
          ...track,
          id: updatedLibrary[existingIndex].id,
          liked: updatedLibrary[existingIndex].liked,
          playCount: updatedLibrary[existingIndex].playCount,
          dateAdded: updatedLibrary[existingIndex].dateAdded,
          isMissing: false,
        }
      } else {
        updatedLibrary.push(track)
        trulyNewTracks.push(track)
      }
    }

    // Also update queue in-place
    const updatedQueue = get().queue.map((q) => {
      const match = newTracks.find(
        (t) =>
          t.id === q.id ||
          t.filePath === q.filePath ||
          (t.fileHash && q.fileHash && t.fileHash === q.fileHash),
      )
      return match
        ? {
            ...q,
            ...match,
            id: q.id,
            liked: q.liked,
            playCount: q.playCount,
            dateAdded: q.dateAdded,
            isMissing: false,
          }
        : q
    })

    // Append any truly new tracks to queue
    for (const track of trulyNewTracks) {
      if (!updatedQueue.some((q) => q.id === track.id)) {
        updatedQueue.push(track)
      }
    }

    // Update currentTrack if it was reconciled
    const currentTrack = get().currentTrack
    let updatedCurrentTrack = currentTrack
    if (currentTrack) {
      const match = newTracks.find(
        (t) =>
          t.id === currentTrack.id ||
          t.filePath === currentTrack.filePath ||
          (t.fileHash && currentTrack.fileHash && t.fileHash === currentTrack.fileHash),
      )
      if (match) {
        updatedCurrentTrack = {
          ...currentTrack,
          ...match,
          id: currentTrack.id,
          liked: currentTrack.liked,
          playCount: currentTrack.playCount,
          dateAdded: currentTrack.dateAdded,
          isMissing: false,
        }
      }
    }

    set({
      library: updatedLibrary,
      queue: updatedQueue.length > 0 ? updatedQueue : updatedLibrary,
      currentTrack: updatedCurrentTrack,
    })

    if (autoPlayFirst && newTracks.length > 0) {
      const targetToPlay =
        updatedLibrary.find(
          (t) =>
            t.id === newTracks[0].id ||
            t.filePath === newTracks[0].filePath ||
            (t.fileHash && newTracks[0].fileHash && t.fileHash === newTracks[0].fileHash),
        ) || newTracks[0]
      get().playTrack(targetToPlay, updatedLibrary)
    } else if (!get().currentTrack && updatedLibrary.length > 0) {
      const firstTrack = updatedLibrary[0]
      set({
        currentTrack: firstTrack,
        currentIndex: 0,
        duration: firstTrack.duration || 0,
      })
    }
  },

  playTrack: (track: Track, customQueue?: Track[]) => {
    if (track.isMissing) {
      console.warn('[PlayerStore] Cannot play track: File is missing on disk:', track.filePath)
      return
    }

    const queue = customQueue || (get().queue.length > 0 ? get().queue : get().library)
    const index = queue.findIndex(
      (t) =>
        t.id === track.id ||
        t.filePath === track.filePath ||
        (t.fileHash && track.fileHash && t.fileHash === track.fileHash),
    )

    set({
      currentTrack: track,
      queue,
      currentIndex: index >= 0 ? index : 0,
      currentTime: 0,
      duration: track.duration || 0,
      isPlaying: true,
    })

    audioEngine.loadAndPlay(track)
  },

  togglePlay: () => {
    const { isPlaying, currentTrack, library } = get()
    if (!currentTrack) {
      if (library.length > 0) {
        get().playTrack(library[0])
      }
      return
    }

    if (isPlaying) {
      audioEngine.pause()
      set({ isPlaying: false })
    } else {
      if (!audioEngine.hasSource() || audioEngine.getCurrentSrc() !== currentTrack.fileUrl) {
        audioEngine.loadAndPlay(currentTrack)
      } else {
        audioEngine.play()
      }
      set({ isPlaying: true })
    }
  },

  play: () => {
    const { currentTrack, library } = get()
    if (currentTrack) {
      if (!audioEngine.hasSource() || audioEngine.getCurrentSrc() !== currentTrack.fileUrl) {
        audioEngine.loadAndPlay(currentTrack)
      } else {
        audioEngine.play()
      }
      set({ isPlaying: true })
      return
    }
    if (library.length > 0) {
      get().playTrack(library[0])
    }
  },

  pause: () => {
    audioEngine.pause()
    set({ isPlaying: false })
  },

  next: () => {
    const { queue, currentIndex, shuffle, repeatMode } = get()
    if (queue.length === 0) return

    let nextIndex = currentIndex + 1

    if (shuffle && queue.length > 1) {
      let randIndex = Math.floor(Math.random() * queue.length)
      while (randIndex === currentIndex) {
        randIndex = Math.floor(Math.random() * queue.length)
      }
      nextIndex = randIndex
    } else if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0
      } else {
        audioEngine.pause()
        set({ isPlaying: false, currentTime: 0 })
        return
      }
    }

    const nextTrack = queue[nextIndex]
    if (nextTrack) {
      get().playTrack(nextTrack, queue)
    }
  },

  previous: () => {
    const { queue, currentIndex, currentTime } = get()
    if (queue.length === 0) return

    if (currentTime > 3) {
      audioEngine.seek(0)
      set({ currentTime: 0 })
      return
    }

    let prevIndex = currentIndex - 1
    if (prevIndex < 0) {
      prevIndex = queue.length - 1
    }

    const prevTrack = queue[prevIndex]
    if (prevTrack) {
      get().playTrack(prevTrack, queue)
    }
  },

  seek: (seconds: number) => {
    audioEngine.seek(seconds)
    set({ currentTime: seconds })
  },

  setVolume: (newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume))
    audioEngine.setVolume(clamped)
    set({
      volume: clamped,
      isMuted: clamped === 0,
      previousVolume: clamped > 0 ? clamped : get().previousVolume,
    })
  },

  toggleMute: () => {
    const { isMuted, volume, previousVolume } = get()
    if (isMuted) {
      const restored = previousVolume > 0 ? previousVolume : 0.85
      audioEngine.setVolume(restored)
      audioEngine.setMuted(false)
      set({ isMuted: false, volume: restored })
    } else {
      audioEngine.setVolume(0)
      audioEngine.setMuted(true)
      set({ isMuted: true, volume: 0, previousVolume: volume > 0 ? volume : 0.85 })
    }
  },

  toggleShuffle: () => {
    set((state) => ({ shuffle: !state.shuffle }))
  },

  toggleRepeat: () => {
    set((state) => {
      const nextMode: RepeatMode =
        state.repeatMode === 'off' ? 'all' : state.repeatMode === 'all' ? 'one' : 'off'
      return { repeatMode: nextMode }
    })
  },

  toggleLike: (trackId?: string) => {
    const targetId = trackId || get().currentTrack?.id
    if (!targetId) return

    const { library, queue, currentTrack } = get()
    const targetTrack = library.find((t) => t.id === targetId)
    if (!targetTrack) return

    const nextLiked = !targetTrack.liked

    const updatedLibrary = library.map((t) =>
      t.id === targetId ? { ...t, liked: nextLiked } : t,
    )
    const updatedQueue = queue.map((t) => (t.id === targetId ? { ...t, liked: nextLiked } : t))
    const updatedCurrent =
      currentTrack?.id === targetId ? { ...currentTrack, liked: nextLiked } : currentTrack

    set({
      library: updatedLibrary,
      queue: updatedQueue,
      currentTrack: updatedCurrent,
    })

    persistenceService.setTrackLiked(targetId, nextLiked)
  },

  handleTrackEnded: () => {
    const { repeatMode, currentTrack, queue } = get()
    if (currentTrack) {
      persistenceService.incrementPlayCount(currentTrack.id).then((newCount) => {
        if (newCount !== null) {
          set((state) => ({
            library: state.library.map((t) =>
              t.id === currentTrack.id ? { ...t, playCount: newCount } : t,
            ),
            currentTrack:
              state.currentTrack?.id === currentTrack.id
                ? { ...state.currentTrack, playCount: newCount }
                : state.currentTrack,
          }))
        }
      })
    }

    if (repeatMode === 'one' && currentTrack) {
      audioEngine.seek(0)
      audioEngine.play()
      set({ currentTime: 0, isPlaying: true })
    } else if (queue.length > 0) {
      get().next()
    }
  },

  setCurrentTime: (currentTime: number) => set({ currentTime }),
  setDuration: (duration: number) => set({ duration }),
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
}))

// Wire up AudioEngine events to playerStore
audioEngine.registerCallbacks({
  onTimeUpdate: (currentTime) => usePlayerStore.getState().setCurrentTime(currentTime),
  onDurationChange: (duration) => usePlayerStore.getState().setDuration(duration),
  onTrackEnded: () => usePlayerStore.getState().handleTrackEnded(),
  onPlayStateChange: (isPlaying) => usePlayerStore.getState().setIsPlaying(isPlaying),
})
