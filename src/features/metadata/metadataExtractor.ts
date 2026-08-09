import * as mm from 'music-metadata-browser'
import type { Track } from '../../types/player'

export function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const tempAudio = new Audio()
    tempAudio.preload = 'metadata'
    tempAudio.src = url

    const cleanup = () => {
      tempAudio.removeEventListener('loadedmetadata', onLoaded)
      tempAudio.removeEventListener('error', onError)
    }

    const onLoaded = () => {
      const dur = tempAudio.duration
      cleanup()
      resolve(Number.isFinite(dur) ? dur : 0)
    }

    const onError = () => {
      cleanup()
      resolve(0)
    }

    tempAudio.addEventListener('loadedmetadata', onLoaded)
    tempAudio.addEventListener('error', onError)
  })
}

function normalizeMimeType(format?: string): string {
  if (!format) return 'image/jpeg'
  const f = format.toLowerCase().trim()
  if (f.includes('png')) return 'image/png'
  if (f.includes('webp')) return 'image/webp'
  if (f.includes('gif')) return 'image/gif'
  if (f.includes('svg')) return 'image/svg+xml'
  return 'image/jpeg'
}

/**
 * Fast direct ID3v2 binary parser for MP3/WAV/AIFF files (pure Web APIs: Uint8Array, DataView, TextDecoder)
 */
function parseDirectID3v2(buffer: Uint8Array): {
  title?: string
  artist?: string
  album?: string
  albumArtist?: string
  year?: number
  genre?: string
  trackNumber?: number
  artworkBlob?: Blob
} | null {
  if (buffer.length < 10) return null
  // 'ID3' magic bytes: 0x49, 0x44, 0x33
  if (buffer[0] !== 0x49 || buffer[1] !== 0x44 || buffer[2] !== 0x33) return null

  const version = buffer[3] // 3 = ID3v2.3, 4 = ID3v2.4, 2 = ID3v2.2
  const flags = buffer[5]
  // Synchsafe integer (7 bits each)
  const tagSize =
    ((buffer[6] & 0x7f) << 21) |
    ((buffer[7] & 0x7f) << 14) |
    ((buffer[8] & 0x7f) << 7) |
    (buffer[9] & 0x7f)

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  let offset = 10

  // Extended header
  if (flags & 0x40) {
    const extSize = version === 4 ? view.getUint32(offset) : view.getUint32(offset) + 4
    offset += extSize
  }

  const tags: Record<string, string> = {}
  let artworkBlob: Blob | undefined
  const tagEnd = Math.min(offset + tagSize, buffer.length)

  while (offset + 10 <= tagEnd) {
    const frameId = String.fromCharCode(
      buffer[offset],
      buffer[offset + 1],
      buffer[offset + 2],
      buffer[offset + 3],
    )
    if (frameId.charCodeAt(0) === 0 || !/^[A-Z0-9]{4}$/.test(frameId)) break

    let frameSize = 0
    if (version === 4) {
      frameSize =
        ((buffer[offset + 4] & 0x7f) << 21) |
        ((buffer[offset + 5] & 0x7f) << 14) |
        ((buffer[offset + 6] & 0x7f) << 7) |
        (buffer[offset + 7] & 0x7f)
    } else {
      frameSize = view.getUint32(offset + 4)
    }

    if (frameSize <= 0 || offset + 10 + frameSize > buffer.length) break

    const frameData = buffer.subarray(offset + 10, offset + 10 + frameSize)
    offset += 10 + frameSize

    if (frameId.startsWith('T') && frameId !== 'TXXX') {
      const encoding = frameData[0]
      const textBytes = frameData.subarray(1)
      let text = ''
      try {
        if (encoding === 0) {
          text = new TextDecoder('iso-8859-1').decode(textBytes)
        } else if (encoding === 1) {
          text = new TextDecoder('utf-16').decode(textBytes)
        } else if (encoding === 2) {
          text = new TextDecoder('utf-16be').decode(textBytes)
        } else {
          text = new TextDecoder('utf-8').decode(textBytes)
        }
      } catch {
        text = new TextDecoder('utf-8').decode(textBytes)
      }
      text = text.replace(/\0+$/, '').trim()
      if (text) {
        tags[frameId] = text
      }
    } else if (frameId === 'APIC') {
      const encoding = frameData[0]
      let pOffset = 1
      let mime = ''
      while (pOffset < frameData.length && frameData[pOffset] !== 0) {
        mime += String.fromCharCode(frameData[pOffset])
        pOffset++
      }
      pOffset++ // skip null byte
      pOffset++ // skip picture type (1 byte)

      // Skip description
      if (encoding === 0 || encoding === 3) {
        while (pOffset < frameData.length && frameData[pOffset] !== 0) pOffset++
        pOffset++
      } else {
        while (
          pOffset + 1 < frameData.length &&
          !(frameData[pOffset] === 0 && frameData[pOffset + 1] === 0)
        ) {
          pOffset += 2
        }
        pOffset += 2
      }

      if (pOffset < frameData.length) {
        const picBytes = frameData.subarray(pOffset)
        const mimeType = normalizeMimeType(mime)
        const cleanBuffer = picBytes.buffer.slice(
          picBytes.byteOffset,
          picBytes.byteOffset + picBytes.byteLength,
        ) as ArrayBuffer
        artworkBlob = new Blob([cleanBuffer], { type: mimeType })
      }
    }
  }

  const title = tags['TIT2'] || tags['TIT1']
  const artist = tags['TPE1'] || tags['TPE2']
  const album = tags['TALB']
  const albumArtist = tags['TPE2']
  const yearStr = tags['TYER'] || tags['TDRC'] || tags['TDAT']
  const year = yearStr ? parseInt(yearStr.slice(0, 4), 10) : undefined
  const genre = tags['TCON']
  const trackStr = tags['TRCK']
  const trackNumber = trackStr ? parseInt(trackStr.split('/')[0], 10) : undefined

  return {
    title,
    artist,
    album,
    albumArtist,
    year: Number.isFinite(year) ? year : undefined,
    genre,
    trackNumber: Number.isFinite(trackNumber) ? trackNumber : undefined,
    artworkBlob,
  }
}

export async function extractTrackMetadata(file: File): Promise<Track> {
  const fileUrl = URL.createObjectURL(file)
  const ext = file.name.split('.').pop()?.toLowerCase() || 'audio'
  const fallbackTitle = file.name.replace(/\.[^/.]+$/, '')

  let title = fallbackTitle
  let artist = 'Unknown Artist'
  let album = 'Unknown Album'
  let albumArtist: string | undefined
  let genre: string | undefined
  let year: number | undefined
  let trackNumber: number | undefined
  let duration = 0
  let artworkUrl: string | null = null

  // Pass 1: Direct ID3 binary parsing for instant, reliable tag extraction
  try {
    const arrayBuffer = await file.slice(0, 512 * 1024).arrayBuffer()
    const id3 = parseDirectID3v2(new Uint8Array(arrayBuffer))
    if (id3) {
      if (id3.title && id3.title.trim()) title = id3.title.trim()
      if (id3.artist && id3.artist.trim()) artist = id3.artist.trim()
      if (id3.album && id3.album.trim()) album = id3.album.trim()
      if (id3.albumArtist && id3.albumArtist.trim()) albumArtist = id3.albumArtist.trim()
      if (id3.genre) genre = id3.genre
      if (id3.year) year = id3.year
      if (id3.trackNumber) trackNumber = id3.trackNumber
      if (id3.artworkBlob) {
        artworkUrl = URL.createObjectURL(id3.artworkBlob)
      }
    }
  } catch (err) {
    console.warn('[MetadataExtractor] Direct ID3 pass error:', err)
  }

  // Pass 2: music-metadata-browser pass for FLAC, OGG, M4A, or additional tags
  if (artist === 'Unknown Artist' || album === 'Unknown Album' || !artworkUrl || duration === 0) {
    try {
      const meta = await mm.parseBlob(file, { duration: true, skipCovers: false })

      if (meta.common.title && meta.common.title.trim()) {
        title = meta.common.title.trim()
      }
      if (meta.common.artist && meta.common.artist.trim()) {
        artist = meta.common.artist.trim()
      } else if (meta.common.artists && meta.common.artists.length > 0 && meta.common.artists[0].trim()) {
        artist = meta.common.artists[0].trim()
      }
      if (meta.common.album && meta.common.album.trim()) {
        album = meta.common.album.trim()
      }
      if (meta.common.albumartist && meta.common.albumartist.trim()) {
        albumArtist = meta.common.albumartist.trim()
      }
      if (meta.common.genre && meta.common.genre.length > 0) {
        genre = meta.common.genre[0]
      }
      if (meta.common.year) {
        year = meta.common.year
      }
      if (meta.common.track && meta.common.track.no) {
        trackNumber = meta.common.track.no
      }
      if (meta.format.duration && meta.format.duration > 0) {
        duration = meta.format.duration
      }

      // Extract embedded artwork picture if not yet extracted
      if (!artworkUrl && meta.common.picture && meta.common.picture.length > 0) {
        const pic = meta.common.picture[0]
        if (pic.data && pic.data.length > 0) {
          const mimeType = normalizeMimeType(pic.format)
          const cleanBuffer = pic.data.buffer.slice(
            pic.data.byteOffset,
            pic.data.byteOffset + pic.data.byteLength,
          ) as ArrayBuffer
          const blob = new Blob([cleanBuffer], { type: mimeType })
          artworkUrl = URL.createObjectURL(blob)
        }
      }
    } catch (err) {
      console.warn('[MetadataExtractor] music-metadata-browser pass error:', err)
    }
  }

  // Pass 3: If duration was not found in metadata header, probe via Audio element
  if (duration === 0) {
    try {
      duration = await getAudioDuration(fileUrl)
    } catch {
      duration = 0
    }
  }

  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    artist,
    album,
    albumArtist,
    genre,
    year,
    trackNumber,
    duration,
    artworkUrl,
    file,
    fileUrl,
    fileName: file.name,
    fileSize: file.size,
    format: ext,
    dateAdded: Date.now(),
  }
}
