import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { PanelLeftOpen } from 'lucide-react'
import { Sidebar } from '../components/sidebar/Sidebar'
import { AmbientBackground } from '../components/ambient/AmbientBackground'
import { AmbientDevSwitcher } from '../components/ambient/AmbientDevSwitcher'
import { AlbumArtwork } from '../components/player/AlbumArtwork'
import { GlassPlayer } from '../components/player/GlassPlayer'
import { LibraryView } from '../components/library/LibraryView'
import { useNavigationStore } from '../stores/navigationStore'
import { usePlayerStore } from '../stores/playerStore'

export function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const activeTab = useNavigationStore((state) => state.activeTab)
  const initializeLibrary = usePlayerStore((state) => state.initializeLibrary)

  useEffect(() => {
    initializeLibrary()
  }, [initializeLibrary])

  return (
    <main className="flex min-h-screen overflow-hidden bg-[#090b14] text-white">
      {/* Collapsible Left Sidebar (Phase 2) */}
      <AnimatePresence initial={false}>
        {isSidebarOpen ? <Sidebar key="sidebar" onCollapse={() => setIsSidebarOpen(false)} /> : null}
      </AnimatePresence>

      {/* Main Content Area (Phase 3 Ambient Layer + Phase 4 Artwork + Phase 5/5.5 Player) */}
      <section className="relative flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden bg-[#0b0e18]">
        {/* Phase 3 Ambient Video Background & Dark Cinematic Overlay */}
        <AmbientBackground />

        {/* Restore Sidebar Button */}
        <AnimatePresence>
          {!isSidebarOpen ? (
            <motion.button
              type="button"
              aria-label="Show sidebar"
              className="absolute left-6 top-6 z-20 grid size-11 place-items-center rounded-xl border border-white/10 bg-[#15111f]/80 text-white/70 shadow-lg backdrop-blur-md transition-colors hover:border-violet-300/30 hover:bg-violet-400/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsSidebarOpen(true)}
            >
              <PanelLeftOpen className="size-5" strokeWidth={1.7} />
            </motion.button>
          ) : null}
        </AnimatePresence>

        {/* Active View Container */}
        {activeTab === 'Library' ? (
          <LibraryView />
        ) : (
          /* Primary Central Experience (Artwork + Glass Player) */
          <div className="relative z-10 flex flex-col items-center justify-center px-4 w-full -translate-y-1 lg:-translate-y-2">
            {/* Phase 4/5.5 Central Album Artwork */}
            <AlbumArtwork />

            {/* Phase 5/5.5 Single Primary Glassmorphism Player Capsule */}
            <div className="mt-4 lg:mt-5">
              <GlassPlayer />
            </div>
          </div>
        )}

        {/* Phase 3 Development Mood Switcher (import.meta.env.DEV only) */}
        <AmbientDevSwitcher />
      </section>
    </main>
  )
}
