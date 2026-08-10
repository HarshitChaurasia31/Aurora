export type AmbientMood =
  | 'none'
  | 'rain'
  | 'mountain'
  | 'night'
  | 'forest'
  | 'ocean'
  | 'city'
  | 'fireplace'
  | 'snow'

export interface AmbientMoodOption {
  readonly id: AmbientMood
  readonly label: string
}

export const AMBIENT_MOOD_OPTIONS: readonly AmbientMoodOption[] = [
  { id: 'rain', label: 'Rain' },
  { id: 'mountain', label: 'Mountain' },
  { id: 'night', label: 'Night' },
  { id: 'forest', label: 'Forest' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'snow', label: 'Snow' },
  { id: 'city', label: 'City' },
  { id: 'fireplace', label: 'Fireplace' },
  { id: 'none', label: 'None' },
] as const
