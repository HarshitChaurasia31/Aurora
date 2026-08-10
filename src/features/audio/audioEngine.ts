import type { Track } from '../../types/player'

class AudioEngine {
  private audio: HTMLAudioElement
  private onTimeUpdateCallback?: (currentTime: number) => void
  private onDurationChangeCallback?: (duration: number) => void
  private onTrackEndedCallback?: () => void
  private onPlayStateChangeCallback?: (isPlaying: boolean) => void

  constructor() {
    this.audio = new Audio()
    this.audio.preload = 'auto'
    this.audio.volume = 0.85

    this.audio.addEventListener('timeupdate', () => {
      if (this.onTimeUpdateCallback && !this.audio.paused) {
        this.onTimeUpdateCallback(this.audio.currentTime)
      }
    })

    this.audio.addEventListener('durationchange', () => {
      if (this.onDurationChangeCallback && Number.isFinite(this.audio.duration)) {
        this.onDurationChangeCallback(this.audio.duration)
      }
    })

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.onDurationChangeCallback && Number.isFinite(this.audio.duration)) {
        this.onDurationChangeCallback(this.audio.duration)
      }
    })

    this.audio.addEventListener('play', () => {
      this.onPlayStateChangeCallback?.(true)
    })

    this.audio.addEventListener('pause', () => {
      this.onPlayStateChangeCallback?.(false)
    })

    this.audio.addEventListener('ended', () => {
      this.onTrackEndedCallback?.()
    })

    this.audio.addEventListener('error', (err) => {
      console.warn('[AudioEngine] Playback error:', err, this.audio.error)
      this.onPlayStateChangeCallback?.(false)
    })
  }

  public registerCallbacks(callbacks: {
    onTimeUpdate: (currentTime: number) => void
    onDurationChange: (duration: number) => void
    onTrackEnded: () => void
    onPlayStateChange: (isPlaying: boolean) => void
  }) {
    this.onTimeUpdateCallback = callbacks.onTimeUpdate
    this.onDurationChangeCallback = callbacks.onDurationChange
    this.onTrackEndedCallback = callbacks.onTrackEnded
    this.onPlayStateChangeCallback = callbacks.onPlayStateChange
  }

  public async loadAndPlay(track: Track, initialPosition = 0): Promise<void> {
    try {
      this.audio.src = track.fileUrl
      this.audio.currentTime = initialPosition
      await this.audio.play()
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.warn('[AudioEngine] Failed to play track:', track.title, err)
      }
    }
  }

  public loadAndPrepare(track: Track, initialPosition = 0): void {
    try {
      this.audio.src = track.fileUrl
      this.audio.currentTime = initialPosition
    } catch (err: unknown) {
      console.warn('[AudioEngine] Failed to prepare track:', track.title, err)
    }
  }

  public hasSource(): boolean {
    return Boolean(this.audio.src)
  }

  public getCurrentSrc(): string {
    return this.audio.src || ''
  }

  public async play(): Promise<void> {
    if (!this.audio.src) return
    try {
      await this.audio.play()
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.warn('[AudioEngine] Playback error on play():', err)
      }
    }
  }

  public pause(): void {
    this.audio.pause()
  }

  public seek(seconds: number): void {
    if (!Number.isFinite(seconds)) return
    const maxDur = Number.isFinite(this.audio.duration) && this.audio.duration > 0 ? this.audio.duration : Infinity
    this.audio.currentTime = Math.max(0, Math.min(seconds, maxDur))
  }

  public skip(deltaSeconds: number): number {
    const current = this.audio.currentTime || 0
    const maxDur = Number.isFinite(this.audio.duration) && this.audio.duration > 0 ? this.audio.duration : Infinity
    const newTime = Math.max(0, Math.min(current + deltaSeconds, maxDur))
    this.audio.currentTime = newTime
    return newTime
  }

  public setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume))
  }

  public setMuted(isMuted: boolean): void {
    this.audio.muted = isMuted
  }

  public getCurrentTime(): number {
    return this.audio.currentTime || 0
  }

  public getDuration(): number {
    return this.audio.duration || 0
  }
}

export const audioEngine = new AudioEngine()
