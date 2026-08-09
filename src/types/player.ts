export type RepeatMode = 'off' | 'all' | 'one'

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  albumArtist?: string
  genre?: string
  year?: number
  trackNumber?: number
  duration: number // in seconds
  artworkUrl?: string | null
  file?: File
  fileUrl: string
  fileName: string
  fileSize?: number
  format: string
  dateAdded: number
}

export interface SongMetadata {
  readonly id: string
  readonly title: string
  readonly artist: string
  readonly album?: string
  readonly artworkUrl?: string | null
}
