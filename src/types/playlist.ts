import type { Track } from './player'

export interface Playlist {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  trackCount: number
  artworkUrl?: string | null
  artworkPath?: string | null
}

export interface PlaylistDetail extends Playlist {
  tracks: Track[]
}
