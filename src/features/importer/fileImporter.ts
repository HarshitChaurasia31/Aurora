import { usePlayerStore } from '../../stores/playerStore'
import { extractTrackMetadata } from '../metadata/metadataExtractor'
import type { Track } from '../../types/player'

const SUPPORTED_EXTENSIONS = new Set(['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'opus'])

export function isSupportedAudioFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return ext ? SUPPORTED_EXTENSIONS.has(ext) : false
}

/**
 * Triggers native desktop file selection for a single audio track
 */
export function importSingleAudioFile(): Promise<Track | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus,audio/mpeg,audio/wav,audio/flac,audio/mp4,audio/aac,audio/ogg,audio/*'
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
        const track = await extractTrackMetadata(file)
        usePlayerStore.getState().addTracks([track], true)
        resolve(track)
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
export function importAudioFolder(): Promise<Track[]> {
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
        const trackPromises = files.map((file) => extractTrackMetadata(file))
        const tracks = await Promise.all(trackPromises)
        usePlayerStore.getState().addTracks(tracks, false)
        resolve(tracks)
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
