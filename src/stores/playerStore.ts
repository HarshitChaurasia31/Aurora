import { create } from 'zustand'
import { audioEngine } from '../features/audio/audioEngine'
import { persistenceService } from '../services/persistenceService'
import type { RepeatMode, Track } from '../types/player'

export interface NowPlayingToastData {
  track: Track
  timestamp: number
}

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
  isQueueOpen: boolean
  importNotification: { message: string; timestamp: number } | null
  nowPlayingToast: NowPlayingToastData | null

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
  setQueueOpen: (open: boolean) => void
  toggleQueue: () => void
  addToQueue: (track: Track) => void
  playNext: (track: Track) => void
  removeFromQueue: (index: number) => void
  moveQueueItem: (fromIndex: number, toIndex: number) => void
  clearQueue: () => void
  playAlbum: (albumName: string, tracks: Track[], startIndex?: number) => void
  playArtist: (artistName: string, tracks: Track[], startIndex?: number) => void
  removeTrack: (trackId: string) => Promise<void>
  setImportNotification: (notif: { message: string; timestamp: number } | null) => void
  setNowPlayingToast: (toast: NowPlayingToastData | null) => void
  triggerNowPlayingToast: (track: Track) => void
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
  isQueueOpen: false,
  importNotification: null,
  nowPlayingToast: null,

  initializeLibrary: async () => {
    if (get().isInitialized) return
    set({ isInitialized: true })

    try {
      const persistedTracks = await persistenceService.loadPersistedLibrary()
      if (persistedTracks.length > 0) {
        const playableTracks = persistedTracks.filter((t) => !t.isMissing)
        const firstPlayable = playableTracks[0] || null

        set({
          library: persistedTracks,
          queue: playableTracks,
          currentTrack: firstPlayable,
          currentIndex: firstPlayable ? 0 : -1,
          duration: firstPlayable?.duration || 0,
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

    // Update queue in-place, filtering out any missing tracks
    const updatedQueue = get()
      .queue.filter((q) => !q.isMissing)
      .map((q) => {
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

    // Append any truly new non-missing tracks to queue
    for (const track of trulyNewTracks) {
      if (!track.isMissing && !updatedQueue.some((q) => q.id === track.id)) {
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

    // Feedback notification
    const addedCount = trulyNewTracks.length
    const reconciledCount = newTracks.length - addedCount
    let message = ''
    if (addedCount > 0 && reconciledCount > 0) {
      message = `${addedCount} ${addedCount === 1 ? 'song' : 'songs'} added, ${reconciledCount} updated`
    } else if (addedCount > 0) {
      message = `${addedCount} ${addedCount === 1 ? 'song' : 'songs'} added to library`
    } else if (reconciledCount > 0) {
      message = `${reconciledCount} ${reconciledCount === 1 ? 'song' : 'songs'} updated`
    }

    const playableLibrary = updatedLibrary.filter((t) => !t.isMissing)

    set({
      library: updatedLibrary,
      queue: updatedQueue.length > 0 ? updatedQueue : playableLibrary,
      currentTrack: updatedCurrentTrack,
      importNotification: message ? { message, timestamp: Date.now() } : null,
    })

    if (autoPlayFirst && newTracks.length > 0) {
      const targetToPlay =
        updatedLibrary.find(
          (t) =>
            !t.isMissing &&
            (t.id === newTracks[0].id ||
              t.filePath === newTracks[0].filePath ||
              (t.fileHash && newTracks[0].fileHash && t.fileHash === newTracks[0].fileHash)),
        ) || playableLibrary[0]

      if (targetToPlay) {
        get().playTrack(targetToPlay, playableLibrary)
      }
    } else if (!get().currentTrack && playableLibrary.length > 0) {
      const firstTrack = playableLibrary[0]
      set({
        currentTrack: firstTrack,
        currentIndex: 0,
        duration: firstTrack.duration || 0,
      })
    }
  },

  playTrack: (track: Track, customQueue?: Track[]) => {
    if (track.isMissing) {
      console.warn('[PlayerStore] Cannot play missing track:', track.filePath)
      return
    }

    const rawQueue = customQueue || (get().queue.length > 0 ? get().queue : get().library)
    const queue = rawQueue.filter((t) => !t.isMissing)
    if (queue.length === 0) return

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
    if (!currentTrack || currentTrack.isMissing) {
      const playable = library.filter((t) => !t.isMissing)
      if (playable.length > 0) {
        get().playTrack(playable[0], playable)
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
    if (currentTrack && !currentTrack.isMissing) {
      if (!audioEngine.hasSource() || audioEngine.getCurrentSrc() !== currentTrack.fileUrl) {
        audioEngine.loadAndPlay(currentTrack)
      } else {
        audioEngine.play()
      }
      set({ isPlaying: true })
      return
    }
    const playable = library.filter((t) => !t.isMissing)
    if (playable.length > 0) {
      get().playTrack(playable[0], playable)
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

  setQueueOpen: (isQueueOpen: boolean) => set({ isQueueOpen }),
  toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),

  addToQueue: (track: Track) => {
    if (track.isMissing) {
      console.warn('[PlayerStore] Cannot add missing track to queue:', track.title)
      return
    }
    set((state) => {
      const cleanQueue = state.queue.filter((t) => !t.isMissing)
      const updated = [...cleanQueue, track]
      return { queue: updated }
    })
  },

  playNext: (track: Track) => {
    if (track.isMissing) {
      console.warn('[PlayerStore] Cannot queue missing track next:', track.title)
      return
    }
    set((state) => {
      const cleanQueue = state.queue.filter((t) => !t.isMissing)
      const { currentIndex } = state
      const insertAt = currentIndex >= 0 ? currentIndex + 1 : 0
      const updated = [...cleanQueue.slice(0, insertAt), track, ...cleanQueue.slice(insertAt)]
      return { queue: updated }
    })
  },

  removeFromQueue: (index: number) => {
    set((state) => {
      const { queue, currentIndex } = state
      if (index < 0 || index >= queue.length) return state
      const updated = queue.filter((_, i) => i !== index)
      let newIndex = currentIndex
      if (index < currentIndex) {
        newIndex = Math.max(0, currentIndex - 1)
      } else if (index === currentIndex && updated.length === 0) {
        newIndex = -1
      }
      return { queue: updated, currentIndex: newIndex }
    })
  },

  moveQueueItem: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const { queue, currentIndex, currentTrack } = state
      if (
        fromIndex < 0 ||
        fromIndex >= queue.length ||
        toIndex < 0 ||
        toIndex >= queue.length ||
        fromIndex === toIndex
      ) {
        return state
      }
      const updated = [...queue]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)

      let newIndex = currentIndex
      if (currentTrack) {
        newIndex = updated.findIndex((t) => t.id === currentTrack.id)
      }
      return { queue: updated, currentIndex: newIndex }
    })
  },

  clearQueue: () => {
    set((state) => {
      const updated =
        state.currentTrack && !state.currentTrack.isMissing ? [state.currentTrack] : []
      return { queue: updated, currentIndex: updated.length > 0 ? 0 : -1 }
    })
  },

  playAlbum: (_albumName: string, tracks: Track[], startIndex = 0) => {
    const playable = tracks.filter((t) => !t.isMissing)
    if (playable.length === 0) return
    const initialIndex = Math.max(0, Math.min(startIndex, playable.length - 1))
    get().playTrack(playable[initialIndex], playable)
  },

  playArtist: (_artistName: string, tracks: Track[], startIndex = 0) => {
    const playable = tracks.filter((t) => !t.isMissing)
    if (playable.length === 0) return
    const initialIndex = Math.max(0, Math.min(startIndex, playable.length - 1))
    get().playTrack(playable[initialIndex], playable)
  },

  removeTrack: async (trackId: string) => {
    const { library, queue, currentTrack, isPlaying } = get()
    const targetTrack = library.find((t) => t.id === trackId)
    if (!targetTrack) return

    const updatedLibrary = library.filter((t) => t.id !== trackId)
    const updatedQueue = queue.filter((t) => t.id !== trackId)

    let updatedCurrentTrack = currentTrack
    let newIndex = -1

    if (currentTrack?.id === trackId) {
      if (updatedQueue.length > 0) {
        const nextTrack = updatedQueue[0]
        updatedCurrentTrack = nextTrack
        newIndex = 0
        if (isPlaying) {
          audioEngine.loadAndPlay(nextTrack)
        }
      } else {
        audioEngine.pause()
        updatedCurrentTrack = null
        newIndex = -1
        set({ isPlaying: false, currentTime: 0, duration: 0 })
      }
    } else if (currentTrack) {
      newIndex = updatedQueue.findIndex((t) => t.id === currentTrack.id)
    }

    set({
      library: updatedLibrary,
      queue: updatedQueue,
      currentTrack: updatedCurrentTrack,
      currentIndex: newIndex,
      importNotification: {
        message: `Removed "${targetTrack.title}" from library`,
        timestamp: Date.now(),
      },
    })

    await persistenceService.removeTrack(trackId)
  },

  setImportNotification: (notif) => set({ importNotification: notif }),

  setNowPlayingToast: (toast) => set({ nowPlayingToast: toast }),

  triggerNowPlayingToast: (track: Track) => {
    if (track.isMissing) return
    const currentToast = get().nowPlayingToast
    // If same track was toasted within the last 2.5s, don't duplicate
    if (
      currentToast &&
      currentToast.track.id === track.id &&
      Date.now() - currentToast.timestamp < 2500
    ) {
      return
    }
    set({
      nowPlayingToast: {
        track,
        timestamp: Date.now(),
      },
    })
  },
}))

// Wire up AudioEngine events to playerStore
audioEngine.registerCallbacks({
  onTimeUpdate: (currentTime) => usePlayerStore.getState().setCurrentTime(currentTime),
  onDurationChange: (duration) => usePlayerStore.getState().setDuration(duration),
  onTrackEnded: () => usePlayerStore.getState().handleTrackEnded(),
  onPlayStateChange: (isPlaying) => {
    usePlayerStore.getState().setIsPlaying(isPlaying)
    if (isPlaying) {
      const current = usePlayerStore.getState().currentTrack
      if (current && !current.isMissing) {
        usePlayerStore.getState().triggerNowPlayingToast(current)
      }
    }
  },
})
