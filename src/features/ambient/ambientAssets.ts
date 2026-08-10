import rainVideo from '../../assets/ambient/rain.mp4'
import mountainVideo from '../../assets/ambient/mountain.mp4'
import nightVideo from '../../assets/ambient/night.mp4'
import forestVideo from '../../assets/ambient/forest.mp4'
import oceanVideo from '../../assets/ambient/ocean.mp4'
import cityVideo from '../../assets/ambient/city.mp4'
import fireplaceVideo from '../../assets/ambient/fireplace.mp4'
import snowVideo from '../../assets/ambient/snow.mp4'
import type { AmbientMood } from '../../types/ambient'

export const AMBIENT_VIDEO_MAP: Record<Exclude<AmbientMood, 'none'>, string> = {
  rain: rainVideo,
  mountain: mountainVideo,
  night: nightVideo,
  forest: forestVideo,
  ocean: oceanVideo,
  snow: snowVideo,
  city: cityVideo,
  fireplace: fireplaceVideo,
}

export function getAmbientVideoAsset(mood: AmbientMood): string | null {
  if (mood === 'none') {
    return null
  }
  return AMBIENT_VIDEO_MAP[mood] ?? null
}
