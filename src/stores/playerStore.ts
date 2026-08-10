import { create } from 'zustand'
import { audioEngine } from '../features/audio/audioEngine'
import { persistenceService } from '../services/persistenceService'
import type { PlaybackState, RepeatMode, Track } from '../types/player'

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
  shuffledIndices: number[]
  shuffledPointer: number
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
  skipForward: (seconds?: number) => void
  skipBackward: (seconds?: number) => void
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
  persistCurrentState: () => void
}

let lastPersistTime = 0
const PERSIST_THROTTLE_MS = 5000

function generateShuffledIndices(length: number, currentIndex: number): number[] {
  const indices = Array.from({ length }, (_, i) => i).filter((i) => i !== currentIndex)
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = indices[i]
    indices[i] = indices[j]
    indices[j] = temp
  }
  if (currentIndex >= 0 && currentIndex < length) {
    return [currentIndex, ...indices]
  }
  return indices
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
  shuffledIndices: [],
  shuffledPointer: 0,
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
      // 1. Load persisted library tracks
      const persistedTracks = await persistenceService.loadPersistedLibrary()
      const playableTracks = persistedTracks.filter((t) => !t.isMissing)

      // 2. Load preferences & persisted playback state
      const [settings, savedState] = await Promise.all([
        persistenceService.getAppSettings(),
        persistenceService.getPlaybackState(),
      ])

      let initialTrack: Track | null = null
      let initialQueue: Track[] = playableTracks
      let initialIndex = -1
      let initialPosition = 0
      let initialVolume = settings?.defaultVolume ?? 0.85
      let initialMuted = false
      let initialShuffle = false
      let initialRepeat: RepeatMode = 'off'

      if (savedState) {
        initialVolume = savedState.volume ?? initialVolume
        initialMuted = savedState.isMuted ?? false
        initialShuffle = savedState.shuffle ?? false
        initialRepeat = savedState.repeatMode ?? 'off'

        // Reconstruct queue from saved track IDs if available
        if (savedState.queueTrackIds && savedState.queueTrackIds.length > 0) {
          const restoredQueue: Track[] = []
          for (const qId of savedState.queueTrackIds) {
            const found = persistedTracks.find((t) => t.id === qId && !t.isMissing)
            if (found) {
              restoredQueue.push(found)
            }
          }
          if (restoredQueue.length > 0) {
            initialQueue = restoredQueue
          }
        }

        // Restore last active track if valid and non-missing
        if (savedState.currentTrackId) {
          const matchedTrack = persistedTracks.find(
            (t) => t.id === savedState.currentTrackId && !t.isMissing,
          )
          if (matchedTrack) {
            initialTrack = matchedTrack
            initialIndex = initialQueue.findIndex((t) => t.id === matchedTrack.id)
            if (initialIndex < 0) {
              initialQueue = [matchedTrack, ...initialQueue]
              initialIndex = 0
            }

            // Restore position if resumePlayerState is enabled or position was non-zero
            if (settings?.resumePlayerState || savedState.currentPosition > 0) {
              initialPosition = savedState.currentPosition || 0
            }
          }
        }
      }

      // Fallback if no last track was restored
      if (!initialTrack && playableTracks.length > 0) {
        initialTrack = playableTracks[0]
        initialIndex = 0
      }

      // Setup audio engine initial state without autoplaying
      audioEngine.setVolume(initialVolume)
      audioEngine.setMuted(initialMuted)

      if (initialTrack) {
        audioEngine.loadAndPrepare(initialTrack, initialPosition)
      }

      const shuffledIdx = initialShuffle
        ? generateShuffledIndices(initialQueue.length, initialIndex)
        : []

      set({
        library: persistedTracks,
        queue: initialQueue,
        currentTrack: initialTrack,
        currentIndex: initialIndex,
        currentTime: initialPosition,
        duration: initialTrack?.duration || 0,
        volume: initialVolume,
        isMuted: initialMuted,
        previousVolume: initialVolume > 0 ? initialVolume : 0.85,
        shuffle: initialShuffle,
        shuffledIndices: shuffledIdx,
        shuffledPointer: 0,
        repeatMode: initialRepeat,
      })
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

    for (const track of trulyNewTracks) {
      if (!track.isMissing && !updatedQueue.some((q) => q.id === track.id)) {
        updatedQueue.push(track)
      }
    }

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
      audioEngine.loadAndPrepare(firstTrack, 0)
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

    const actualIndex = index >= 0 ? index : 0
    const shuffledIdx = get().shuffle ? generateShuffledIndices(queue.length, actualIndex) : []

    set({
      currentTrack: track,
      queue,
      currentIndex: actualIndex,
      shuffledIndices: shuffledIdx,
      shuffledPointer: 0,
      currentTime: 0,
      duration: track.duration || 0,
      isPlaying: true,
    })

    audioEngine.loadAndPlay(track, 0)
    get().persistCurrentState()
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
      get().persistCurrentState()
    } else {
      if (!audioEngine.hasSource() || audioEngine.getCurrentSrc() !== currentTrack.fileUrl) {
        audioEngine.loadAndPlay(currentTrack, get().currentTime)
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
        audioEngine.loadAndPlay(currentTrack, get().currentTime)
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
    get().persistCurrentState()
  },

  next: () => {
    const { queue, currentIndex, shuffle, shuffledIndices, shuffledPointer, repeatMode } = get()
    const playableQueue = queue.filter((t) => !t.isMissing)
    if (playableQueue.length === 0) return

    let nextTrack: Track | null = null
    let nextIndex = -1
    let nextShuffledPointer = shuffledPointer

    if (shuffle && playableQueue.length > 1) {
      let pool = shuffledIndices
      if (pool.length !== playableQueue.length) {
        pool = generateShuffledIndices(playableQueue.length, currentIndex)
      }
      const nextPtr = shuffledPointer + 1
      if (nextPtr < pool.length) {
        nextIndex = pool[nextPtr]
        nextShuffledPointer = nextPtr
        nextTrack = playableQueue[nextIndex]
      } else {
        // Shuffled pool reached end
        if (repeatMode === 'all') {
          const freshPool = generateShuffledIndices(playableQueue.length, -1)
          nextIndex = freshPool[0]
          nextShuffledPointer = 0
          nextTrack = playableQueue[nextIndex]
          set({ shuffledIndices: freshPool })
        } else {
          audioEngine.pause()
          set({ isPlaying: false, currentTime: 0 })
          get().persistCurrentState()
          return
        }
      }
    } else {
      nextIndex = currentIndex + 1
      if (nextIndex >= playableQueue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0
          nextTrack = playableQueue[0]
        } else {
          audioEngine.pause()
          set({ isPlaying: false, currentTime: 0 })
          get().persistCurrentState()
          return
        }
      } else {
        nextTrack = playableQueue[nextIndex]
      }
    }

    if (nextTrack) {
      set({
        currentTrack: nextTrack,
        currentIndex: nextIndex,
        shuffledPointer: nextShuffledPointer,
        currentTime: 0,
        duration: nextTrack.duration || 0,
        isPlaying: true,
      })
      audioEngine.loadAndPlay(nextTrack, 0)
      get().persistCurrentState()
    }
  },

  previous: () => {
    const { queue, currentIndex, currentTime, repeatMode } = get()
    const playableQueue = queue.filter((t) => !t.isMissing)
    if (playableQueue.length === 0) return

    // If more than 3 seconds into track, restart current track
    if (currentTime > 3.0) {
      audioEngine.seek(0)
      set({ currentTime: 0 })
      return
    }

    let prevIndex = currentIndex - 1
    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        prevIndex = playableQueue.length - 1
      } else {
        prevIndex = 0
      }
    }

    const prevTrack = playableQueue[prevIndex]
    if (prevTrack) {
      set({
        currentTrack: prevTrack,
        currentIndex: prevIndex,
        currentTime: 0,
        duration: prevTrack.duration || 0,
        isPlaying: true,
      })
      audioEngine.loadAndPlay(prevTrack, 0)
      get().persistCurrentState()
    }
  },

  skipForward: (seconds = 10) => {
    const newTime = audioEngine.skip(seconds)
    set({ currentTime: newTime })
    get().persistCurrentState()
  },

  skipBackward: (seconds = 10) => {
    const newTime = audioEngine.skip(-seconds)
    set({ currentTime: newTime })
    get().persistCurrentState()
  },

  seek: (seconds: number) => {
    audioEngine.seek(seconds)
    set({ currentTime: seconds })
    get().persistCurrentState()
  },

  setVolume: (newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume))
    audioEngine.setVolume(clamped)
    set({
      volume: clamped,
      isMuted: clamped === 0,
      previousVolume: clamped > 0 ? clamped : get().previousVolume,
    })
    get().persistCurrentState()
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
    get().persistCurrentState()
  },

  toggleShuffle: () => {
    set((state) => {
      const nextShuffle = !state.shuffle
      const cleanQueue = state.queue.filter((t) => !t.isMissing)
      const shuffledIdx = nextShuffle
        ? generateShuffledIndices(cleanQueue.length, state.currentIndex)
        : []
      return {
        shuffle: nextShuffle,
        shuffledIndices: shuffledIdx,
        shuffledPointer: 0,
      }
    })
    get().persistCurrentState()
  },

  toggleRepeat: () => {
    set((state) => {
      const nextMode: RepeatMode =
        state.repeatMode === 'off' ? 'all' : state.repeatMode === 'all' ? 'one' : 'off'
      return { repeatMode: nextMode }
    })
    get().persistCurrentState()
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

    if (repeatMode === 'one' && currentTrack && !currentTrack.isMissing) {
      audioEngine.seek(0)
      audioEngine.play()
      set({ currentTime: 0, isPlaying: true })
    } else if (queue.length > 0) {
      get().next()
    }
  },

  setCurrentTime: (currentTime: number) => {
    set({ currentTime })
    // Throttle playback position persistence
    const now = Date.now()
    if (now - lastPersistTime > PERSIST_THROTTLE_MS) {
      lastPersistTime = now
      get().persistCurrentState()
    }
  },

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
    get().persistCurrentState()
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
    get().persistCurrentState()
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
    get().persistCurrentState()
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
    get().persistCurrentState()
  },

  clearQueue: () => {
    set((state) => {
      const updated =
        state.currentTrack && !state.currentTrack.isMissing ? [state.currentTrack] : []
      return { queue: updated, currentIndex: updated.length > 0 ? 0 : -1 }
    })
    get().persistCurrentState()
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
          audioEngine.loadAndPlay(nextTrack, 0)
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
    get().persistCurrentState()
  },

  setImportNotification: (notif) => set({ importNotification: notif }),

  setNowPlayingToast: (toast) => set({ nowPlayingToast: toast }),

  triggerNowPlayingToast: (track: Track) => {
    if (track.isMissing) return
    const currentToast = get().nowPlayingToast
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

  persistCurrentState: () => {
    const { currentTrack, currentTime, queue, currentIndex, shuffle, repeatMode, volume, isMuted } =
      get()

    const playbackState: PlaybackState = {
      currentTrackId: currentTrack && !currentTrack.isMissing ? currentTrack.id : null,
      currentPosition: Math.max(0, currentTime),
      queueTrackIds: queue.filter((t) => !t.isMissing).map((t) => t.id),
      queueIndex: Math.max(0, currentIndex),
      shuffle,
      repeatMode,
      volume,
      isMuted,
    }

    persistenceService.savePlaybackState(playbackState).catch((err) => {
      console.warn('[PlayerStore] Error saving playback state:', err)
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

// Listen to beforeunload for final shutdown persistence
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    usePlayerStore.getState().persistCurrentState()
  })
}
