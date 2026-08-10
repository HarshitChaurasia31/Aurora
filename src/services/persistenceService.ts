import { convertFileSrc, invoke, isTauri } from '@tauri-apps/api/core'
import type { CustomMood } from '../types/ambient'
import type { PlaybackState, Track } from '../types/player'
import type { Playlist, PlaylistDetail } from '../types/playlist'
import type { AppSettings, StorageStats } from '../types/settings'

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

export interface DbPlaylist {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  trackCount: number
  artworkPath?: string | null
}

export interface DbPlaylistDetail {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  tracks: DbTrack[]
}

const artworkDataUrlCache = new Map<string, string>()

async function resolveArtworkSrc(artworkPath: string): Promise<string> {
  if (artworkDataUrlCache.has(artworkPath)) {
    return artworkDataUrlCache.get(artworkPath)!
  }

  try {
    const dataUrl = await invoke<string>('read_artwork_data_url', { path: artworkPath })
    artworkDataUrlCache.set(artworkPath, dataUrl)
    return dataUrl
  } catch (err) {
    console.warn('[PersistenceService] Failed to read artwork via IPC, fallback to convertFileSrc:', err)
    return convertFileSrc(artworkPath)
  }
}

async function mapDbTrackToTrack(dbTrack: DbTrack): Promise<Track> {
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
}

export const persistenceService = {
  isTauriAvailable: (): boolean => isTauri(),

  initDatabase: async (): Promise<void> => {
    if (!isTauri()) return
    try {
      await invoke('init_database')
    } catch (err) {
      console.error('[PersistenceService] Failed to initialize database:', err)
    }
  },

  pickAudioFile: async (): Promise<SelectedAudioFile | null> => {
    if (!isTauri()) return null
    try {
      return await invoke<SelectedAudioFile | null>('pick_audio_file')
    } catch (err) {
      console.error('[PersistenceService] Failed to pick audio file:', err)
      return null
    }
  },

  pickAudioFolder: async (): Promise<SelectedAudioFile[]> => {
    if (!isTauri()) return []
    try {
      return await invoke<SelectedAudioFile[]>('pick_audio_folder')
    } catch (err) {
      console.error('[PersistenceService] Failed to pick audio folder:', err)
      return []
    }
  },

  readFileBytes: async (path: string): Promise<Uint8Array | null> => {
    if (!isTauri()) return null
    try {
      const numbers = await invoke<number[]>('read_file_bytes', { path })
      return new Uint8Array(numbers)
    } catch (err) {
      console.error('[PersistenceService] Failed to read file bytes:', err)
      return null
    }
  },

  resolveArtworkSrc: async (artworkPath: string): Promise<string> => {
    return resolveArtworkSrc(artworkPath)
  },

  saveArtworkCache: async (bytes: Uint8Array, format = 'jpg'): Promise<string | null> => {
    if (!isTauri()) return null
    try {
      const path = await invoke<string>('save_artwork', {
        bytes: Array.from(bytes),
        format,
      })
      return path
    } catch (err) {
      console.error('[PersistenceService] Failed to cache artwork to disk:', err)
      return null
    }
  },

  saveArtworkBytes: async (bytes: Uint8Array, mime?: string): Promise<string | null> => {
    const format = mime?.includes('png') ? 'png' : mime?.includes('webp') ? 'webp' : 'jpg'
    return persistenceService.saveArtworkCache(bytes, format)
  },

  saveTracks: async (tracks: Track[]): Promise<Track[]> => {
    if (!isTauri() || tracks.length === 0) return tracks

    try {
      await persistenceService.initDatabase()

      const inputs: DbTrackInput[] = tracks.map((t) => ({
        id: t.id,
        filePath: t.filePath,
        fileHash: t.fileHash || null,
        title: t.title,
        artist: t.artist,
        album: t.album,
        albumArtist: t.albumArtist || null,
        genre: t.genre || null,
        year: t.year || null,
        trackNumber: t.trackNumber || null,
        duration: t.duration,
        fileName: t.fileName,
        fileSize: t.fileSize || 0,
        format: t.format,
        artworkPath: t.artworkPath || null,
        dateAdded: t.dateAdded || Date.now(),
      }))

      const savedDbTracks = await invoke<DbTrack[]>('save_tracks', { inputs })

      return await Promise.all(
        savedDbTracks.map(async (dbTrack) => {
          const original = tracks.find(
            (t) =>
              t.id === dbTrack.id ||
              t.filePath === dbTrack.filePath ||
              (t.fileHash && dbTrack.fileHash && t.fileHash === dbTrack.fileHash),
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

  persistTracks: async (tracks: Track[]): Promise<Track[]> => {
    return persistenceService.saveTracks(tracks)
  },

  loadPersistedLibrary: async (): Promise<Track[]> => {
    if (!isTauri()) return []

    try {
      await persistenceService.initDatabase()
      const dbTracks = await invoke<DbTrack[]>('get_all_tracks')

      const tracks: Track[] = await Promise.all(
        dbTracks.map(async (dbTrack) => {
          return mapDbTrackToTrack(dbTrack)
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

  // ==========================================
  // PHASE 7: PLAYLIST PERSISTENCE
  // ==========================================

  createPlaylist: async (name: string): Promise<Playlist | null> => {
    if (!isTauri()) return null
    try {
      await persistenceService.initDatabase()
      const dbPlaylist = await invoke<DbPlaylist>('create_playlist', { name })
      return {
        id: dbPlaylist.id,
        name: dbPlaylist.name,
        createdAt: dbPlaylist.createdAt,
        updatedAt: dbPlaylist.updatedAt,
        trackCount: 0,
        artworkUrl: null,
        artworkPath: null,
      }
    } catch (err) {
      console.error('[PersistenceService] Failed to create playlist:', err)
      return null
    }
  },

  getAllPlaylists: async (): Promise<Playlist[]> => {
    if (!isTauri()) return []
    try {
      await persistenceService.initDatabase()
      const dbPlaylists = await invoke<DbPlaylist[]>('get_all_playlists')
      return await Promise.all(
        dbPlaylists.map(async (p) => {
          const artworkUrl = p.artworkPath ? await resolveArtworkSrc(p.artworkPath) : null
          return {
            id: p.id,
            name: p.name,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            trackCount: p.trackCount,
            artworkUrl,
            artworkPath: p.artworkPath,
          }
        }),
      )
    } catch (err) {
      console.error('[PersistenceService] Failed to load playlists:', err)
      return []
    }
  },

  getPlaylistDetail: async (id: string): Promise<PlaylistDetail | null> => {
    if (!isTauri()) return null
    try {
      await persistenceService.initDatabase()
      const detail = await invoke<DbPlaylistDetail | null>('get_playlist_detail', { id })
      if (!detail) return null

      const tracks = await Promise.all(detail.tracks.map((t) => mapDbTrackToTrack(t)))

      // Find first track with artwork for playlist cover
      const firstWithArt = tracks.find((t) => Boolean(t.artworkUrl))
      const artworkUrl = firstWithArt?.artworkUrl || null

      return {
        id: detail.id,
        name: detail.name,
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt,
        trackCount: tracks.length,
        artworkUrl,
        tracks,
      }
    } catch (err) {
      console.error('[PersistenceService] Failed to get playlist detail:', err)
      return null
    }
  },

  renamePlaylist: async (id: string, name: string): Promise<boolean> => {
    if (!isTauri()) return false
    try {
      await invoke('rename_playlist', { id, name })
      return true
    } catch (err) {
      console.error('[PersistenceService] Failed to rename playlist:', err)
      return false
    }
  },

  deletePlaylist: async (id: string): Promise<boolean> => {
    if (!isTauri()) return false
    try {
      await invoke('delete_playlist', { id })
      return true
    } catch (err) {
      console.error('[PersistenceService] Failed to delete playlist:', err)
      return false
    }
  },

  addTrackToPlaylist: async (playlistId: string, trackId: string): Promise<boolean> => {
    if (!isTauri()) return false
    try {
      return await invoke<boolean>('add_track_to_playlist', { playlistId, trackId })
    } catch (err) {
      console.error('[PersistenceService] Failed to add track to playlist:', err)
      return false
    }
  },

  removeTrackFromPlaylist: async (playlistId: string, trackId: string): Promise<boolean> => {
    if (!isTauri()) return false
    try {
      await invoke('remove_track_from_playlist', { playlistId, trackId })
      return true
    } catch (err) {
      console.error('[PersistenceService] Failed to remove track from playlist:', err)
      return false
    }
  },

  reorderPlaylistTracks: async (playlistId: string, trackIds: string[]): Promise<boolean> => {
    if (!isTauri()) return false
    try {
      await invoke('reorder_playlist_tracks', { playlistId, trackIds })
      return true
    } catch (err) {
      console.error('[PersistenceService] Failed to reorder playlist tracks:', err)
      return false
    }
  },

  // ==========================================
  // PHASE 8B: CUSTOM AMBIENT MOODS
  // ==========================================

  pickAmbientVideo: async (): Promise<string | null> => {
    if (!isTauri()) return null
    try {
      return await invoke<string | null>('pick_ambient_video')
    } catch (err) {
      console.error('[PersistenceService] Failed to pick ambient video:', err)
      return null
    }
  },

  getAllCustomMoods: async (): Promise<CustomMood[]> => {
    if (!isTauri()) return []
    try {
      return await invoke<CustomMood[]>('get_all_custom_moods')
    } catch (err) {
      console.error('[PersistenceService] Failed to get custom moods:', err)
      return []
    }
  },

  createCustomMood: async (name: string, videoPath: string): Promise<CustomMood | null> => {
    if (!isTauri()) return null
    try {
      return await invoke<CustomMood>('create_custom_mood', { name, videoPath })
    } catch (err) {
      console.error('[PersistenceService] Failed to create custom mood:', err)
      throw err
    }
  },

  renameCustomMood: async (id: string, name: string): Promise<boolean> => {
    if (!isTauri()) return false
    try {
      await invoke('rename_custom_mood', { id, name })
      return true
    } catch (err) {
      console.error('[PersistenceService] Failed to rename custom mood:', err)
      throw err
    }
  },

  updateCustomMoodVideo: async (id: string, videoPath: string): Promise<boolean> => {
    if (!isTauri()) return false
    try {
      await invoke('update_custom_mood_video', { id, videoPath })
      return true
    } catch (err) {
      console.error('[PersistenceService] Failed to update custom mood video path:', err)
      throw err
    }
  },

  deleteCustomMood: async (id: string): Promise<boolean> => {
    if (!isTauri()) return false
    try {
      await invoke('delete_custom_mood', { id })
      return true
    } catch (err) {
      console.error('[PersistenceService] Failed to delete custom mood:', err)
      return false
    }
  },

  // ==========================================
  // PHASE 8C: SETTINGS & STORAGE STATS
  // ==========================================

  getAppSettings: async (): Promise<AppSettings> => {
    if (!isTauri()) {
      return {
        startWithLastMood: true,
        resumePlayerState: false,
        autoplayOnImport: true,
        defaultVolume: 1.0,
        ambientVideoEnabled: true,
        ambientIntensity: 1.0,
        musicDirectory: 'D:\\Music',
      }
    }
    try {
      return await invoke<AppSettings>('get_app_settings')
    } catch (err) {
      console.error('[PersistenceService] Failed to get app settings:', err)
      return {
        startWithLastMood: true,
        resumePlayerState: false,
        autoplayOnImport: true,
        defaultVolume: 1.0,
        ambientVideoEnabled: true,
        ambientIntensity: 1.0,
        musicDirectory: 'D:\\Music',
      }
    }
  },

  updateAppSettings: async (settings: AppSettings): Promise<boolean> => {
    if (!isTauri()) return false
    try {
      await invoke('update_app_settings', { settings })
      return true
    } catch (err) {
      console.error('[PersistenceService] Failed to update app settings:', err)
      return false
    }
  },

  resetAppSettings: async (): Promise<AppSettings | null> => {
    if (!isTauri()) return null
    try {
      return await invoke<AppSettings>('reset_app_settings')
    } catch (err) {
      console.error('[PersistenceService] Failed to reset app settings:', err)
      return null
    }
  },

  getStorageStats: async (): Promise<StorageStats | null> => {
    if (!isTauri()) return null
    try {
      return await invoke<StorageStats>('get_storage_stats')
    } catch (err) {
      console.error('[PersistenceService] Failed to get storage stats:', err)
      return null
    }
  },

  pickMusicFolder: async (): Promise<string | null> => {
    if (!isTauri()) return null
    try {
      return await invoke<string | null>('pick_music_folder')
    } catch (err) {
      console.error('[PersistenceService] Failed to pick music folder:', err)
      return null
    }
  },

  // ==========================================
  // PHASE 9: PLAYBACK STATE PERSISTENCE
  // ==========================================

  getPlaybackState: async (): Promise<PlaybackState | null> => {
    if (!isTauri()) return null
    try {
      return await invoke<PlaybackState>('get_playback_state')
    } catch (err) {
      console.error('[PersistenceService] Failed to get playback state:', err)
      return null
    }
  },

  savePlaybackState: async (state: PlaybackState): Promise<boolean> => {
    if (!isTauri()) return false
    try {
      await invoke('save_playback_state', { state })
      return true
    } catch (err) {
      console.error('[PersistenceService] Failed to save playback state:', err)
      return false
    }
  },
}
