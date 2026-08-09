import { create } from 'zustand'
import { audioEngine } from '../features/audio/audioEngine'
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

  // Actions
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

  addTracks: (newTracks: Track[], autoPlayFirst = false) => {
    if (!newTracks || newTracks.length === 0) return

    const currentLib = get().library
    // Avoid duplicate tracks by ID
    const existingIds = new Set(currentLib.map((t) => t.id))
    const uniqueNewTracks = newTracks.filter((t) => !existingIds.has(t.id))

    if (uniqueNewTracks.length === 0) {
      // If already in library and autoPlayFirst requested, play the existing match
      if (autoPlayFirst && newTracks.length > 0) {
        const match = currentLib.find((t) => t.id === newTracks[0].id) || currentLib.find((t) => t.fileName === newTracks[0].fileName)
        if (match) {
          get().playTrack(match, currentLib)
        }
      }
      return
    }

    const updatedLibrary = [...currentLib, ...uniqueNewTracks]

    set((state) => {
      const updatedQueue = state.queue.length === 0 ? updatedLibrary : [...state.queue, ...uniqueNewTracks]
      return {
        library: updatedLibrary,
        queue: updatedQueue,
      }
    })

    if (autoPlayFirst && uniqueNewTracks.length > 0) {
      get().playTrack(uniqueNewTracks[0], updatedLibrary)
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
    const queue = customQueue || (get().queue.length > 0 ? get().queue : get().library)
    const index = queue.findIndex((t) => t.id === track.id)

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
        // Reached end of queue without repeat all
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

    // If more than 3 seconds in, restart current track
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

  handleTrackEnded: () => {
    const { repeatMode, currentTrack, queue } = get()
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
