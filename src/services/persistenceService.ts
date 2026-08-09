import { convertFileSrc, invoke, isTauri } from '@tauri-apps/api/core'
import type { Track } from '../types/player'

export interface SelectedAudioFile {
  path: string
  name: string
  size: number
}

export interface DbTrack {
  id: string
  filePath: string
  fileHash?: string | null
  title?: string | null
  artist?: string | null
  album?: string | null
  albumArtist?: string | null
  genre?: string | null
  year?: number | null
  trackNumber?: number | null
  duration: number
  fileName: string
  fileSize: number
  format: string
  artworkPath?: string | null
  dateAdded: number
  liked: boolean
  playCount: number
  isMissing: boolean
}

export interface DbTrackInput {
  id?: string
  filePath: string
  fileHash?: string | null
  title?: string | null
  artist?: string | null
  album?: string | null
  albumArtist?: string | null
  genre?: string | null
  year?: number | null
  trackNumber?: number | null
  duration: number
  fileName: string
  fileSize: number
  format: string
  artworkPath?: string | null
  dateAdded?: number | null
}

export async function computeBufferHash(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  try {
    const copy = new Uint8Array(data.byteLength)
    copy.set(data)
    const digest = await crypto.subtle.digest('SHA-256', copy.buffer)
    const hashArray = Array.from(new Uint8Array(digest))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data[i]
      hash |= 0
    }
    return `art_${Math.abs(hash).toString(16)}_${data.length}`
  }
}

export async function resolveArtworkSrc(artworkPath?: string | null): Promise<string | null> {
  if (!artworkPath) return null
  if (!isTauri()) return artworkPath

  try {
    const dataUrl = await invoke<string>('read_artwork_data_url', { path: artworkPath })
    if (dataUrl) return dataUrl
  } catch {
    try {
      return convertFileSrc(artworkPath)
    } catch {
      return null
    }
  }
  return convertFileSrc(artworkPath)
}

export const persistenceService = {
  initDatabase: async (): Promise<void> => {
    if (!isTauri()) return
    try {
      await invoke('init_database')
    } catch (err) {
      console.error('[PersistenceService] Failed to init database:', err)
    }
  },

  resolveArtworkSrc,

  pickAudioFile: async (): Promise<SelectedAudioFile | null> => {
    if (!isTauri()) return null
    try {
      return await invoke<SelectedAudioFile | null>('pick_audio_file')
    } catch (err) {
      console.error('[PersistenceService] pick_audio_file error:', err)
      return null
    }
  },

  pickAudioFolder: async (): Promise<SelectedAudioFile[]> => {
    if (!isTauri()) return []
    try {
      return await invoke<SelectedAudioFile[]>('pick_audio_folder')
    } catch (err) {
      console.error('[PersistenceService] pick_audio_folder error:', err)
      return []
    }
  },

  readFileBytes: async (path: string): Promise<Uint8Array | null> => {
    if (!isTauri()) return null
    try {
      const bytes = await invoke<number[]>('read_file_bytes', { path })
      return new Uint8Array(bytes)
    } catch (err) {
      console.error('[PersistenceService] read_file_bytes error:', err)
      return null
    }
  },

  saveArtworkBytes: async (bytes: Uint8Array, format?: string): Promise<string | null> => {
    if (!isTauri() || bytes.length === 0) return null
    try {
      const hash = await computeBufferHash(bytes)
      const ext = format?.toLowerCase().includes('png')
        ? 'png'
        : format?.toLowerCase().includes('webp')
          ? 'webp'
          : 'jpg'
      const filePath = await invoke<string>('save_artwork', {
        hash,
        bytes: Array.from(bytes),
        ext,
      })
      return filePath
    } catch (err) {
      console.warn('[PersistenceService] Failed to save artwork:', err)
      return null
    }
  },

  persistTracks: async (tracks: Track[]): Promise<Track[]> => {
    if (!isTauri() || tracks.length === 0) return tracks

    try {
      const inputs: DbTrackInput[] = tracks.map((t) => ({
        id: t.id,
        filePath: t.filePath || t.fileName,
        fileHash: t.fileHash,
        title: t.title,
        artist: t.artist,
        album: t.album,
        albumArtist: t.albumArtist,
        genre: t.genre,
        year: t.year,
        trackNumber: t.trackNumber,
        duration: t.duration,
        fileName: t.fileName,
        fileSize: t.fileSize || 0,
        format: t.format,
        artworkPath: t.artworkPath,
        dateAdded: t.dateAdded,
      }))

      const savedDbTracks = await invoke<DbTrack[]>('save_tracks', { tracks: inputs })
      return await Promise.all(
        savedDbTracks.map(async (dbTrack) => {
          const original = tracks.find(
            (t) =>
              t.filePath === dbTrack.filePath ||
              t.id === dbTrack.id ||
              (t.fileHash && t.fileHash === dbTrack.fileHash),
          )
          const artworkUrl = dbTrack.artworkPath
            ? await resolveArtworkSrc(dbTrack.artworkPath)
            : original?.artworkUrl || null

          return {
            id: dbTrack.id,
            filePath: dbTrack.filePath,
            fileHash: dbTrack.fileHash || undefined,
            title: dbTrack.title || dbTrack.fileName.replace(/\.[^/.]+$/, ''),
            artist: dbTrack.artist || 'Unknown Artist',
            album: dbTrack.album || 'Unknown Album',
            albumArtist: dbTrack.albumArtist || undefined,
            genre: dbTrack.genre || undefined,
            year: dbTrack.year || undefined,
            trackNumber: dbTrack.trackNumber || undefined,
            duration: dbTrack.duration,
            artworkUrl,
            artworkPath: dbTrack.artworkPath,
            file: original?.file,
            fileUrl: isTauri() ? convertFileSrc(dbTrack.filePath) : original?.fileUrl || '',
            fileName: dbTrack.fileName,
            fileSize: dbTrack.fileSize,
            format: dbTrack.format,
            dateAdded: dbTrack.dateAdded,
            liked: dbTrack.liked,
            playCount: Number(dbTrack.playCount) || 0,
            isMissing: dbTrack.isMissing,
          }
        }),
      )
    } catch (err) {
      console.error('[PersistenceService] Failed to persist tracks:', err)
      return tracks
    }
  },

  loadPersistedLibrary: async (): Promise<Track[]> => {
    if (!isTauri()) return []

    try {
      await persistenceService.initDatabase()
      const dbTracks = await invoke<DbTrack[]>('get_all_tracks')

      const tracks: Track[] = await Promise.all(
        dbTracks.map(async (dbTrack) => {
          const fileUrl = convertFileSrc(dbTrack.filePath)
          const artworkUrl = dbTrack.artworkPath
            ? await resolveArtworkSrc(dbTrack.artworkPath)
            : null

          return {
            id: dbTrack.id,
            filePath: dbTrack.filePath,
            fileHash: dbTrack.fileHash || undefined,
            title: dbTrack.title || dbTrack.fileName.replace(/\.[^/.]+$/, ''),
            artist: dbTrack.artist || 'Unknown Artist',
            album: dbTrack.album || 'Unknown Album',
            albumArtist: dbTrack.albumArtist || undefined,
            genre: dbTrack.genre || undefined,
            year: dbTrack.year || undefined,
            trackNumber: dbTrack.trackNumber || undefined,
            duration: dbTrack.duration,
            artworkUrl,
            artworkPath: dbTrack.artworkPath,
            fileUrl,
            fileName: dbTrack.fileName,
            fileSize: dbTrack.fileSize,
            format: dbTrack.format,
            dateAdded: dbTrack.dateAdded,
            liked: dbTrack.liked,
            playCount: Number(dbTrack.playCount) || 0,
            isMissing: dbTrack.isMissing,
          }
        }),
      )

      return tracks
    } catch (err) {
      console.error('[PersistenceService] Failed to load library from SQLite:', err)
      return []
    }
  },

  setTrackLiked: async (id: string, liked: boolean): Promise<void> => {
    if (!isTauri()) return
    try {
      await invoke('update_track_liked', { id, liked })
    } catch (err) {
      console.warn('[PersistenceService] Failed to update liked:', err)
    }
  },

  incrementPlayCount: async (id: string): Promise<number | null> => {
    if (!isTauri()) return null
    try {
      return await invoke<number>('increment_play_count', { id })
    } catch (err) {
      console.warn('[PersistenceService] Failed to increment play count:', err)
      return null
    }
  },

  removeTrack: async (id: string): Promise<boolean> => {
    if (!isTauri()) return true
    try {
      await invoke('delete_track', { id })
      return true
    } catch (err) {
      console.error('[PersistenceService] Failed to delete track from SQLite:', err)
      return false
    }
  },
}
