import rainVideo from '../../assets/ambient/rain.mp4'
import mountainVideo from '../../assets/ambient/mountain.mp4'
import nightVideo from '../../assets/ambient/night.mp4'
import type { AmbientMood } from '../../types/ambient'

export const AMBIENT_VIDEO_MAP: Record<Exclude<AmbientMood, 'none'>, string> = {
  rain: rainVideo,
  mountain: mountainVideo,
  night: nightVideo,
}

export function getAmbientVideoAsset(mood: AmbientMood): string | null {
  if (mood === 'none') {
    return null
  }
  return AMBIENT_VIDEO_MAP[mood] ?? null
}
