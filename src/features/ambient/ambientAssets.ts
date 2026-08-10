import { convertFileSrc, isTauri } from '@tauri-apps/api/core'
import rainVideo from '../../assets/ambient/rain.mp4'
import mountainVideo from '../../assets/ambient/mountain.mp4'
import nightVideo from '../../assets/ambient/night.mp4'
import forestVideo from '../../assets/ambient/forest.mp4'
import oceanVideo from '../../assets/ambient/ocean.mp4'
import cityVideo from '../../assets/ambient/city.mp4'
import fireplaceVideo from '../../assets/ambient/fireplace.mp4'
import snowVideo from '../../assets/ambient/snow.mp4'
import type { BuiltInMood, CustomMood } from '../../types/ambient'

export const AMBIENT_VIDEO_MAP: Record<Exclude<BuiltInMood, 'none'>, string> = {
  rain: rainVideo,
  mountain: mountainVideo,
  night: nightVideo,
  forest: forestVideo,
  ocean: oceanVideo,
  snow: snowVideo,
  city: cityVideo,
  fireplace: fireplaceVideo,
}

export function getAmbientVideoAsset(mood: string, customMoods: CustomMood[] = []): string | null {
  if (mood === 'none') {
    return null
  }
  if (mood in AMBIENT_VIDEO_MAP) {
    return AMBIENT_VIDEO_MAP[mood as Exclude<BuiltInMood, 'none'>] ?? null
  }
  const custom = customMoods.find((m) => m.id === mood)
  if (custom && !custom.isMissing && custom.videoPath) {
    if (isTauri()) {
      return convertFileSrc(custom.videoPath)
    }
    return custom.videoPath
  }
  return null
}
