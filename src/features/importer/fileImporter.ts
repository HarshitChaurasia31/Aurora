import { isTauri } from '@tauri-apps/api/core'
import { usePlayerStore } from '../../stores/playerStore'
import { persistenceService } from '../../services/persistenceService'
import { extractTrackMetadata } from '../metadata/metadataExtractor'
import type { Track } from '../../types/player'

const SUPPORTED_EXTENSIONS = new Set(['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'opus'])

export function isSupportedAudioFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return ext ? SUPPORTED_EXTENSIONS.has(ext) : false
}

function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'mp3':
      return 'audio/mpeg'
    case 'wav':
      return 'audio/wav'
    case 'flac':
      return 'audio/flac'
    case 'm4a':
    case 'aac':
      return 'audio/mp4'
    case 'ogg':
    case 'opus':
      return 'audio/ogg'
    default:
      return 'audio/*'
  }
}

/**
 * Triggers native desktop file selection for a single audio track with absolute filesystem path
 */
export async function importSingleAudioFile(): Promise<Track | null> {
  // If running inside Tauri desktop app, use native OS file dialog to guarantee absolute filesystem path
  if (isTauri()) {
    try {
      const selected = await persistenceService.pickAudioFile()
      if (!selected) return null

      const bytes = await persistenceService.readFileBytes(selected.path)
      if (!bytes || bytes.length === 0) {
        console.error('[Importer] Failed to read audio file bytes:', selected.path)
        return null
      }

      const cleanBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer
      const file = new File([cleanBuffer], selected.name, { type: getMimeType(selected.name) })

      const rawTrack = await extractTrackMetadata(file, selected.path)
      const [persistedTrack] = await persistenceService.persistTracks([rawTrack])
      const finalTrack = persistedTrack || rawTrack
      usePlayerStore.getState().addTracks([finalTrack], true)
      return finalTrack
    } catch (err) {
      console.error('[Importer] Error in native single file import:', err)
      return null
    }
  }

  // Browser / Web fallback
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept =
      '.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus,audio/mpeg,audio/wav,audio/flac,audio/mp4,audio/aac,audio/ogg,audio/*'
    input.style.display = 'none'
    document.body.appendChild(input)

    const cleanup = () => {
      if (input.parentNode) {
        input.parentNode.removeChild(input)
      }
    }

    input.onchange = async () => {
      const file = input.files?.[0]
      cleanup()

      if (!file) {
        resolve(null)
        return
      }

      if (!isSupportedAudioFile(file.name)) {
        console.warn('[Importer] Selected file format is not supported:', file.name)
        resolve(null)
        return
      }

      try {
        const rawTrack = await extractTrackMetadata(file)
        const [persistedTrack] = await persistenceService.persistTracks([rawTrack])
        const finalTrack = persistedTrack || rawTrack
        usePlayerStore.getState().addTracks([finalTrack], true)
        resolve(finalTrack)
      } catch (err) {
        console.error('[Importer] Failed to import audio file:', file.name, err)
        resolve(null)
      }
    }

    input.oncancel = () => {
      cleanup()
      resolve(null)
    }

    input.click()
  })
}

/**
 * Triggers native desktop folder selection and recursively discovers supported audio tracks
 */
export async function importAudioFolder(): Promise<Track[]> {
  // If running inside Tauri desktop app, use native OS folder dialog
  if (isTauri()) {
    try {
      const selectedFiles = await persistenceService.pickAudioFolder()
      if (!selectedFiles || selectedFiles.length === 0) return []

      const rawTracks: Track[] = []
      for (const item of selectedFiles) {
        try {
          const bytes = await persistenceService.readFileBytes(item.path)
          if (bytes && bytes.length > 0) {
            const cleanBuffer = bytes.buffer.slice(
              bytes.byteOffset,
              bytes.byteOffset + bytes.byteLength,
            ) as ArrayBuffer
            const file = new File([cleanBuffer], item.name, { type: getMimeType(item.name) })
            const track = await extractTrackMetadata(file, item.path)
            rawTracks.push(track)
          }
        } catch (fileErr) {
          console.warn('[Importer] Skipping invalid track in folder:', item.path, fileErr)
        }
      }

      if (rawTracks.length === 0) return []

      const persistedTracks = await persistenceService.persistTracks(rawTracks)
      const finalTracks = persistedTracks.length > 0 ? persistedTracks : rawTracks
      usePlayerStore.getState().addTracks(finalTracks, false)
      return finalTracks
    } catch (err) {
      console.error('[Importer] Error in native folder import:', err)
      return []
    }
  }

  // Browser / Web fallback
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.setAttribute('webkitdirectory', 'true')
    input.setAttribute('directory', 'true')
    input.multiple = true
    input.style.display = 'none'
    document.body.appendChild(input)

    const cleanup = () => {
      if (input.parentNode) {
        input.parentNode.removeChild(input)
      }
    }

    input.onchange = async () => {
      const fileList = input.files
      cleanup()

      if (!fileList || fileList.length === 0) {
        resolve([])
        return
      }

      const files: File[] = []
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        if (isSupportedAudioFile(file.name)) {
          files.push(file)
        }
      }

      if (files.length === 0) {
        console.warn('[Importer] No supported audio files found in selected folder.')
        resolve([])
        return
      }

      try {
        const rawTracks: Track[] = []
        for (const file of files) {
          try {
            const track = await extractTrackMetadata(file)
            rawTracks.push(track)
          } catch (fileErr) {
            console.warn('[Importer] Skipping invalid track:', file.name, fileErr)
          }
        }

        const persistedTracks = await persistenceService.persistTracks(rawTracks)
        const finalTracks = persistedTracks.length > 0 ? persistedTracks : rawTracks
        usePlayerStore.getState().addTracks(finalTracks, false)
        resolve(finalTracks)
      } catch (err) {
        console.error('[Importer] Error scanning audio folder:', err)
        resolve([])
      }
    }

    input.oncancel = () => {
      cleanup()
      resolve([])
    }

    input.click()
  })
}
