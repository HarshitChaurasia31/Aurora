import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { PanelLeftOpen } from 'lucide-react'
import { Sidebar } from '../components/sidebar/Sidebar'
import { AmbientBackground } from '../components/ambient/AmbientBackground'
import { AmbientDevSwitcher } from '../components/ambient/AmbientDevSwitcher'

export function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <main className="flex min-h-screen overflow-hidden bg-[#090b14] text-white">
      <AnimatePresence initial={false}>
        {isSidebarOpen ? <Sidebar key="sidebar" onCollapse={() => setIsSidebarOpen(false)} /> : null}
      </AnimatePresence>

      <section className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-[#0b0e18]">
        {/* Ambient video background layer & dark cinematic overlay */}
        <AmbientBackground />

        {/* Restore sidebar button */}
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

        {/* Central main content */}
        <div className="relative z-10 text-center select-none px-6">
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-violet-200/60">Aurora</p>
          <h1 className="mt-4 text-2xl font-medium tracking-tight text-white/90">Your music. Your atmosphere.</h1>
          <p className="mt-3 text-sm text-white/40">Atmospheric background</p>
        </div>

        {/* Development ambient mood switcher */}
        <AmbientDevSwitcher />
      </section>
    </main>
  )
}
