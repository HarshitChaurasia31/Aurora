import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { PanelLeftOpen } from 'lucide-react'
import { Sidebar } from '../components/sidebar/Sidebar'
import { AmbientBackground } from '../components/ambient/AmbientBackground'
import { AmbientDevSwitcher } from '../components/ambient/AmbientDevSwitcher'
import { AlbumArtwork } from '../components/player/AlbumArtwork'
import { GlassPlayer } from '../components/player/GlassPlayer'
import { LibraryView } from '../components/library/LibraryView'
import { SearchView } from '../components/search/SearchView'
import { AlbumsView } from '../components/albums/AlbumsView'
import { ArtistsView } from '../components/artists/ArtistsView'
import { LikedSongsView } from '../components/liked/LikedSongsView'
import { NowPlayingToast } from '../components/player/NowPlayingToast'
import { QueueDrawer } from '../components/queue/QueueDrawer'
import { useNavigationStore } from '../stores/navigationStore'
import { usePlayerStore } from '../stores/playerStore'

export function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedAlbumFromSearch, setSelectedAlbumFromSearch] = useState<string | null>(null)
  const [selectedArtistFromSearch, setSelectedArtistFromSearch] = useState<string | null>(null)

  const activeTab = useNavigationStore((state) => state.activeTab)
  const setActiveTab = useNavigationStore((state) => state.setActiveTab)
  const initializeLibrary = usePlayerStore((state) => state.initializeLibrary)

  useEffect(() => {
    initializeLibrary()
  }, [initializeLibrary])

  const handleSelectAlbum = (albumName: string) => {
    setSelectedAlbumFromSearch(albumName)
    setActiveTab('Albums')
  }

  const handleSelectArtist = (artistName: string) => {
    setSelectedArtistFromSearch(artistName)
    setActiveTab('Artists')
  }

  return (
    <main className="flex min-h-screen overflow-hidden bg-[#090b14] text-white">
      {/* Collapsible Left Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarOpen ? <Sidebar key="sidebar" onCollapse={() => setIsSidebarOpen(false)} /> : null}
      </AnimatePresence>

      {/* Main Content Area */}
      <section className="relative flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden bg-[#0b0e18]">
        {/* Ambient Video Background & Dark Cinematic Overlay */}
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

        {/* View Switcher based on Active Tab */}
        {activeTab === 'Library' ? (
          <LibraryView />
        ) : activeTab === 'Search' ? (
          <SearchView
            onSelectAlbum={handleSelectAlbum}
            onSelectArtist={handleSelectArtist}
          />
        ) : activeTab === 'Albums' ? (
          <AlbumsView
            initialAlbum={selectedAlbumFromSearch}
            onClearInitialAlbum={() => setSelectedAlbumFromSearch(null)}
          />
        ) : activeTab === 'Artists' ? (
          <ArtistsView
            initialArtist={selectedArtistFromSearch}
            onClearInitialArtist={() => setSelectedArtistFromSearch(null)}
            onSelectAlbum={handleSelectAlbum}
          />
        ) : activeTab === 'Liked Songs' ? (
          <LikedSongsView />
        ) : activeTab === 'Settings' ? (
          <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center">
            <h2 className="text-xl font-medium text-white/90">Settings</h2>
            <p className="mt-2 text-xs text-white/45 max-w-sm">
              Aurora Desktop • Local Persistence via SQLite • Tauri 2.0
            </p>
          </div>
        ) : (
          /* Home Screen: VISUALLY FROZEN (Album Artwork + Liquid Glass Player) */
          <div className="relative z-10 flex flex-col items-center justify-center px-4 w-full -translate-y-1 lg:-translate-y-2">
            <AlbumArtwork />
            <div className="mt-4 lg:mt-5">
              <GlassPlayer />
            </div>
          </div>
        )}

        {/* Now Playing Toast Feedback */}
        <NowPlayingToast />

        {/* Playback Queue Drawer Overlay */}
        <QueueDrawer />

        {/* Ambient Mood Switcher (import.meta.env.DEV only) */}
        <AmbientDevSwitcher />
      </section>
    </main>
  )
}
