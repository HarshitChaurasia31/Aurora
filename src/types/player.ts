export type RepeatMode = 'off' | 'all' | 'one'

export interface Track {
  id: string
  filePath: string
  fileHash?: string
  title: string
  artist: string
  album: string
  albumArtist?: string
  genre?: string
  year?: number
  trackNumber?: number
  duration: number // in seconds
  artworkUrl?: string | null
  artworkPath?: string | null
  file?: File
  fileUrl: string
  fileName: string
  fileSize?: number
  format: string
  dateAdded: number
  liked: boolean
  playCount: number
  isMissing?: boolean
}

export interface SongMetadata {
  readonly id: string
  readonly title: string
  readonly artist: string
  readonly album?: string
  readonly artworkUrl?: string | null
  readonly liked?: boolean
  readonly playCount?: number
  readonly isMissing?: boolean
}
