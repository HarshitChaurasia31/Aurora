import { motion } from 'framer-motion'
import { AlertCircle, Edit2, MoreVertical, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAmbientStore } from '../../stores/ambientStore'
import { AMBIENT_MOOD_OPTIONS, type AmbientMood } from '../../types/ambient'

export function AmbientMoodSelector() {
  const currentMood = useAmbientStore((state) => state.currentMood)
  const setMood = useAmbientStore((state) => state.setMood)
  const customMoods = useAmbientStore((state) => state.customMoods)
  const openCreateModal = useAmbientStore((state) => state.openCreateModal)
  const openEditModal = useAmbientStore((state) => state.openEditModal)
  const openRelinkModal = useAmbientStore((state) => state.openRelinkModal)
  const openDeleteModal = useAmbientStore((state) => state.openDeleteModal)

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  // Close context menu on outside click or Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuId(null)
      }
    }
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null)
      }
    }
    if (activeMenuId) {
      document.addEventListener('pointerdown', handleOutsideClick)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('pointerdown', handleOutsideClick)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [activeMenuId])

  return (
    <aside
      aria-label="Ambient Mood Controls"
      className="absolute bottom-5 right-5 z-20 flex max-w-[calc(100vw-2.5rem)] items-center gap-1.5 rounded-full border border-white/10 bg-[#0d0e19]/85 p-1.5 shadow-2xl backdrop-blur-xl transition-opacity hover:opacity-100 overflow-visible"
    >
      <span className="shrink-0 px-2 text-[10px] font-medium tracking-[0.16em] uppercase text-violet-200/50">
        Mood
      </span>

      {/* Built-in Moods */}
      <div className="flex shrink-0 items-center gap-1">
        {AMBIENT_MOOD_OPTIONS.map((option) => {
          const isActive = currentMood === option.id

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setActiveMenuId(null)
                setMood(option.id as AmbientMood)
              }}
              className={`relative shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${
                isActive
                  ? 'text-white'
                  : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
              }`}
            >
              {isActive ? (
                <motion.span
                  layoutId="active-ambient-mood"
                  className="absolute inset-0 rounded-full bg-violet-500/25 border border-violet-400/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              ) : null}
              <span className="relative z-10">{option.label}</span>
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="h-4 w-px shrink-0 bg-white/10 mx-0.5" />

      {/* Custom Moods */}
      {customMoods.length > 0 ? (
        <div className="flex shrink-0 items-center gap-1">
          {customMoods.map((mood) => {
            const isActive = currentMood === mood.id
            const isMenuOpen = activeMenuId === mood.id

            return (
              <div key={mood.id} className="relative flex items-center">
                <div
                  className={`group relative flex items-center rounded-full border transition-colors ${
                    isActive
                      ? 'bg-violet-500/25 border-violet-400/40 text-white shadow-sm'
                      : mood.isMissing
                        ? 'bg-amber-500/10 border-amber-400/30 text-amber-300/90'
                        : 'bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white/90'
                  }`}
                >
                  {/* Select Mood Pill Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuId(null)
                      setMood(mood.id)
                      if (mood.isMissing) {
                        openRelinkModal(mood)
                      }
                    }}
                    title={
                      mood.isMissing
                        ? `${mood.name} (Video file unavailable - click to relink)`
                        : `${mood.name} (${mood.videoPath})`
                    }
                    className="flex items-center gap-1.5 py-1 pl-2.5 pr-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-violet-300"
                  >
                    {mood.isMissing ? (
                      <AlertCircle className="size-3 text-amber-400 shrink-0" />
                    ) : null}
                    <span className="max-w-[100px] truncate">{mood.name}</span>
                  </button>

                  {/* 3-Dot Options Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveMenuId((prev) => (prev === mood.id ? null : mood.id))
                    }}
                    aria-label={`Options for ${mood.name}`}
                    title="Mood options"
                    className={`grid size-5 place-items-center rounded-full mr-1 transition-colors ${
                      isMenuOpen
                        ? 'bg-white/25 text-white'
                        : 'text-white/40 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    <MoreVertical className="size-3" />
                  </button>
                </div>

                {/* Contextual Dropdown Menu */}
                {isMenuOpen ? (
                  <div
                    ref={menuRef}
                    className="absolute bottom-full right-0 mb-2 w-48 rounded-xl border border-white/15 bg-[#121424]/95 p-1 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-2.5 py-1.5 border-b border-white/10">
                      <p className="text-[11px] font-medium text-white/90 truncate">{mood.name}</p>
                      <p className="text-[10px] text-white/40 truncate font-mono">{mood.videoPath}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenuId(null)
                        openEditModal(mood)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors text-left"
                    >
                      <Edit2 className="size-3.5 text-violet-300 shrink-0" />
                      <span>Rename</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenuId(null)
                        openRelinkModal(mood)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors text-left"
                    >
                      <RefreshCw className="size-3.5 text-violet-300 shrink-0" />
                      <span>Change Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenuId(null)
                        openDeleteModal(mood)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 transition-colors text-left"
                    >
                      <Trash2 className="size-3.5 text-rose-400 shrink-0" />
                      <span>Delete</span>
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}

      {/* Add Custom Mood Button */}
      <button
        type="button"
        onClick={() => {
          setActiveMenuId(null)
          openCreateModal()
        }}
        title="Add custom ambient video"
        className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-violet-400/40 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300 transition-colors hover:border-violet-400/70 hover:bg-violet-500/20 hover:text-violet-200"
      >
        <Plus className="size-3" />
        <span>Custom</span>
      </button>
    </aside>
  )
}
