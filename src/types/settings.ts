export interface AppSettings {
  startWithLastMood: boolean
  resumePlayerState: boolean
  autoplayOnImport: boolean
  defaultVolume: number
  ambientVideoEnabled: boolean
  ambientIntensity: number
  musicDirectory: string | null
}

export interface StorageStats {
  trackCount: number
  playlistCount: number
  customMoodCount: number
  dbSizeBytes: number
  artworkCacheSizeBytes: number
}
