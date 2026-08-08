export type AmbientMood = 'none' | 'rain' | 'mountain' | 'night'

export interface AmbientMoodOption {
  readonly id: AmbientMood
  readonly label: string
}

export const AMBIENT_MOOD_OPTIONS: readonly AmbientMoodOption[] = [
  { id: 'rain', label: 'Rain' },
  { id: 'mountain', label: 'Mountain' },
  { id: 'night', label: 'Night' },
  { id: 'none', label: 'None' },
] as const
