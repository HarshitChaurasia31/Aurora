import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Folder,
  HardDrive,
  Info,
  Music,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
  Volume2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAmbientStore } from '../../stores/ambientStore'
import { usePlayerStore } from '../../stores/playerStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { AMBIENT_MOOD_OPTIONS } from '../../types/ambient'
import { ScrollToTopButton } from '../common/ScrollToTopButton'

export function SettingsView() {
  const settings = useSettingsStore((state) => state.settings)
  const stats = useSettingsStore((state) => state.stats)
  const loadSettings = useSettingsStore((state) => state.loadSettings)
  const loadStats = useSettingsStore((state) => state.loadStats)
  const updateSetting = useSettingsStore((state) => state.updateSetting)
  const pickAndSetMusicFolder = useSettingsStore((state) => state.pickAndSetMusicFolder)
  const openResetModal = useSettingsStore((state) => state.openResetModal)

  const currentMood = useAmbientStore((state) => state.currentMood)
  const setMood = useAmbientStore((state) => state.setMood)
  const customMoods = useAmbientStore((state) => state.customMoods)

  const initializeLibrary = usePlayerStore((state) => state.initializeLibrary)

  const [isRescanning, setIsRescanning] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSettings()
    loadStats()
  }, [loadSettings, loadStats])

  const handleScroll = () => {
    if (scrollRef.current) {
      setShowScrollTop(scrollRef.current.scrollTop > 200)
    }
  }

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handlePickFolder = async () => {
    const chosen = await pickAndSetMusicFolder()
    if (chosen) {
      showToast(`Music folder updated: ${chosen}`)
      loadStats()
    }
  }

  const handleRescan = async () => {
    setIsRescanning(true)
    try {
      await initializeLibrary()
      await loadStats()
      showToast('Library rescan complete')
    } catch (err) {
      console.error('Failed to rescan library:', err)
      showToast('Library scan failed')
    } finally {
      setIsRescanning(false)
    }
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="relative size-full overflow-y-auto overflow-x-hidden"
    >
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white/95">Settings</h1>
          <p className="mt-1 text-xs text-white/45">
            Configure application preferences, ambient background behavior, and music storage.
          </p>
        </div>

        {/* 1. GENERAL SECTION */}
        <section className="rounded-2xl border border-white/10 bg-[#0c0d18]/60 p-6 shadow-xl backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Sliders className="size-4 text-violet-400" />
            <h2 className="text-sm font-semibold tracking-wider uppercase text-white/80">General</h2>
          </div>

          <div className="space-y-4">
            {/* Start with Last Mood */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/90">Remember Selected Ambient Mood</p>
                <p className="text-xs text-white/45">Automatically restore your last active ambient background on launch</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.startWithLastMood}
                onClick={() => updateSetting('startWithLastMood', !settings.startWithLastMood)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-violet-400 ${
                  settings.startWithLastMood ? 'bg-violet-600' : 'bg-white/15'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.startWithLastMood ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Resume Player State */}
            <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
              <div>
                <p className="text-sm font-medium text-white/90">Restore Player State on Launch</p>
                <p className="text-xs text-white/45">Keep your previous track and queue prepared when starting Aurora</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.resumePlayerState}
                onClick={() => updateSetting('resumePlayerState', !settings.resumePlayerState)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-violet-400 ${
                  settings.resumePlayerState ? 'bg-violet-600' : 'bg-white/15'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.resumePlayerState ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* 2. PLAYBACK SECTION */}
        <section className="rounded-2xl border border-white/10 bg-[#0c0d18]/60 p-6 shadow-xl backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Music className="size-4 text-violet-400" />
            <h2 className="text-sm font-semibold tracking-wider uppercase text-white/80">Playback</h2>
          </div>

          <div className="space-y-5">
            {/* Autoplay on Import */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/90">Autoplay on Import</p>
                <p className="text-xs text-white/45">Immediately begin playback when importing new audio files</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.autoplayOnImport}
                onClick={() => updateSetting('autoplayOnImport', !settings.autoplayOnImport)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-violet-400 ${
                  settings.autoplayOnImport ? 'bg-violet-600' : 'bg-white/15'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.autoplayOnImport ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Default Startup Volume */}
            <div className="border-t border-white/[0.06] pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="size-4 text-white/60" />
                  <p className="text-sm font-medium text-white/90">Default Startup Volume</p>
                </div>
                <span className="text-xs font-mono text-violet-300 font-medium">
                  {Math.round(settings.defaultVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.defaultVolume}
                onChange={(e) => updateSetting('defaultVolume', Number.parseFloat(e.target.value))}
                className="w-full accent-violet-500 bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* 3. AMBIENT SECTION */}
        <section className="rounded-2xl border border-white/10 bg-[#0c0d18]/60 p-6 shadow-xl backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Sparkles className="size-4 text-violet-400" />
            <h2 className="text-sm font-semibold tracking-wider uppercase text-white/80">Ambient Video</h2>
          </div>

          <div className="space-y-5">
            {/* Enable Ambient Videos */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/90">Enable Ambient Video Backgrounds</p>
                <p className="text-xs text-white/45">Render cinematic ambient looping videos behind the liquid-glass interface</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.ambientVideoEnabled}
                onClick={() => {
                  const nextVal = !settings.ambientVideoEnabled
                  updateSetting('ambientVideoEnabled', nextVal)
                  showToast(nextVal ? 'Ambient video enabled' : 'Ambient video disabled')
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-violet-400 ${
                  settings.ambientVideoEnabled ? 'bg-violet-600' : 'bg-white/15'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.ambientVideoEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Background Video Intensity / Opacity */}
            <div className="border-t border-white/[0.06] pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings.ambientIntensity > 0.5 ? (
                    <Eye className="size-4 text-white/60" />
                  ) : (
                    <EyeOff className="size-4 text-white/60" />
                  )}
                  <p className="text-sm font-medium text-white/90">Background Video Intensity</p>
                </div>
                <span className="text-xs font-mono text-violet-300 font-medium">
                  {Math.round(settings.ambientIntensity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={settings.ambientIntensity}
                disabled={!settings.ambientVideoEnabled}
                onChange={(e) => updateSetting('ambientIntensity', Number.parseFloat(e.target.value))}
                className="w-full accent-violet-500 bg-white/10 h-1.5 rounded-lg cursor-pointer disabled:opacity-30"
              />
            </div>

            {/* Quick Mood Selection */}
            <div className="border-t border-white/[0.06] pt-4 space-y-2">
              <p className="text-sm font-medium text-white/90">Active Ambient Theme</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {AMBIENT_MOOD_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setMood(option.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      currentMood === option.id
                        ? 'bg-violet-500/25 border border-violet-400/40 text-white'
                        : 'bg-white/[0.04] border border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
                {customMoods.map((mood) => (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => setMood(mood.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors truncate max-w-[120px] ${
                      currentMood === mood.id
                        ? 'bg-violet-500/25 border border-violet-400/40 text-white'
                        : 'bg-white/[0.04] border border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {mood.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. LIBRARY SECTION */}
        <section className="rounded-2xl border border-white/10 bg-[#0c0d18]/60 p-6 shadow-xl backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Folder className="size-4 text-violet-400" />
            <h2 className="text-sm font-semibold tracking-wider uppercase text-white/80">Music Library</h2>
          </div>

          <div className="space-y-4">
            {/* Music Folder Path */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white/90">Default Music Directory</p>
                <p className="text-xs text-white/45 font-mono mt-0.5" title={settings.musicDirectory ?? ''}>
                  {settings.musicDirectory || 'D:\\Music'}
                </p>
              </div>
              <button
                type="button"
                onClick={handlePickFolder}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white/80 hover:bg-white/[0.12] hover:text-white transition-colors shrink-0"
              >
                <Folder className="size-3.5 text-violet-300" />
                Change Folder
              </button>
            </div>

            {/* Rescan Library */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
              <div>
                <p className="text-sm font-medium text-white/90">Rescan Library</p>
                <p className="text-xs text-white/45">Refresh metadata and discover newly added files from your music folder</p>
              </div>
              <button
                type="button"
                onClick={handleRescan}
                disabled={isRescanning}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-xs font-medium text-violet-200 hover:bg-violet-500/25 transition-colors shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`size-3.5 ${isRescanning ? 'animate-spin' : ''}`} />
                {isRescanning ? 'Scanning...' : 'Rescan Library'}
              </button>
            </div>
          </div>
        </section>

        {/* 5. STORAGE & DATABASE SECTION */}
        <section className="rounded-2xl border border-white/10 bg-[#0c0d18]/60 p-6 shadow-xl backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <HardDrive className="size-4 text-violet-400" />
            <h2 className="text-sm font-semibold tracking-wider uppercase text-white/80">Storage & Database</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Library</p>
              <p className="text-lg font-semibold text-white/90 mt-1">
                {stats?.trackCount ?? 0} <span className="text-xs font-normal text-white/40">tracks</span>
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Playlists</p>
              <p className="text-lg font-semibold text-white/90 mt-1">
                {stats?.playlistCount ?? 0} <span className="text-xs font-normal text-white/40">playlists</span>
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Custom Moods</p>
              <p className="text-lg font-semibold text-white/90 mt-1">
                {stats?.customMoodCount ?? 0} <span className="text-xs font-normal text-white/40">videos</span>
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Database Size</p>
              <p className="text-lg font-semibold text-white/90 mt-1">
                {stats ? (stats.dbSizeBytes / 1024).toFixed(1) : '0'} <span className="text-xs font-normal text-white/40">KB</span>
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 sm:col-span-2">
              <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Artwork Cache</p>
              <p className="text-lg font-semibold text-white/90 mt-1">
                {stats ? (stats.artworkCacheSizeBytes / (1024 * 1024)).toFixed(2) : '0'}{' '}
                <span className="text-xs font-normal text-white/40">MB</span>
              </p>
            </div>
          </div>
        </section>

        {/* 6. DANGER ZONE */}
        <section className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-6 shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-rose-500/20 pb-3">
            <AlertTriangle className="size-4 text-rose-400" />
            <h2 className="text-sm font-semibold tracking-wider uppercase text-rose-300">Danger Zone</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white/90">Reset All Preferences</p>
              <p className="text-xs text-white/45">
                Restores volume, ambient intensity, and toggles to default settings. Music files and library are preserved.
              </p>
            </div>
            <button
              type="button"
              onClick={openResetModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-2 text-xs font-medium text-rose-200 hover:bg-rose-500/25 transition-colors shrink-0"
            >
              <RotateCcw className="size-3.5" />
              Reset Preferences
            </button>
          </div>
        </section>

        {/* 7. ABOUT SECTION */}
        <section className="rounded-2xl border border-white/10 bg-[#0c0d18]/40 p-6 shadow-xl backdrop-blur-xl space-y-3">
          <div className="flex items-center gap-2.5">
            <Info className="size-4 text-violet-400" />
            <h2 className="text-sm font-semibold tracking-wider uppercase text-white/80">About Aurora</h2>
          </div>

          <div className="text-xs text-white/60 space-y-1.5 pt-1">
            <p className="text-sm font-medium text-white/95">Aurora Desktop Music Player</p>
            <p>Version 0.1.0 • Tauri 2.0 + SQLite + React</p>
            <p className="text-white/40">
              A cinematic local-first audio experience featuring ambient video backgrounds, embedded artwork caching, and SQLite metadata persistence.
            </p>
          </div>
        </section>

        {/* Toast Notification */}
        {toastMessage ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-violet-400/30 bg-[#121424]/90 px-4 py-2 text-xs font-medium text-white shadow-2xl backdrop-blur-xl"
          >
            <Check className="size-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        ) : null}
      </div>

      {/* Floating Scroll to Top Pill */}
      <ScrollToTopButton visible={showScrollTop} onClick={scrollToTop} />
    </div>
  )
}
