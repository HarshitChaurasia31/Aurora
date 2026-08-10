import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Home, Maximize2, Minimize2, PanelLeftOpen } from 'lucide-react'
import { Sidebar } from '../components/sidebar/Sidebar'
import { AmbientBackground } from '../components/ambient/AmbientBackground'
import { AmbientMoodSelector } from '../components/ambient/AmbientMoodSelector'
import { AlbumArtwork } from '../components/player/AlbumArtwork'
import { GlassPlayer } from '../components/player/GlassPlayer'
import { LibraryView } from '../components/library/LibraryView'
import { SearchView } from '../components/search/SearchView'
import { PlaylistsView } from '../components/playlists/PlaylistsView'
import { CreatePlaylistModal } from '../components/playlists/CreatePlaylistModal'
import { RenamePlaylistModal } from '../components/playlists/RenamePlaylistModal'
import { DeletePlaylistModal } from '../components/playlists/DeletePlaylistModal'
import { AddToPlaylistModal } from '../components/playlists/AddToPlaylistModal'
import { CreateCustomMoodModal } from '../components/ambient/CreateCustomMoodModal'
import { RenameCustomMoodModal } from '../components/ambient/RenameCustomMoodModal'
import { RelinkCustomMoodModal } from '../components/ambient/RelinkCustomMoodModal'
import { DeleteCustomMoodModal } from '../components/ambient/DeleteCustomMoodModal'
import { SettingsView } from '../components/settings/SettingsView'
import { ResetSettingsModal } from '../components/settings/ResetSettingsModal'
import { AlbumsView } from '../components/albums/AlbumsView'
import { ArtistsView } from '../components/artists/ArtistsView'
import { LikedSongsView } from '../components/liked/LikedSongsView'
import { NowPlayingToast } from '../components/player/NowPlayingToast'
import { QueueDrawer } from '../components/queue/QueueDrawer'
import { useNavigationStore } from '../stores/navigationStore'
import { usePlayerStore } from '../stores/playerStore'
import { useFullscreenStore } from '../stores/fullscreenStore'
import { useGlobalKeyboardShortcuts } from '../hooks/useGlobalKeyboardShortcuts'

export function AppShell() {
  useGlobalKeyboardShortcuts()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedAlbumFromSearch, setSelectedAlbumFromSearch] = useState<string | null>(null)
  const [selectedArtistFromSearch, setSelectedArtistFromSearch] = useState<string | null>(null)

  const activeTab = useNavigationStore((state) => state.activeTab)
  const setActiveTab = useNavigationStore((state) => state.setActiveTab)
  const initializeLibrary = usePlayerStore((state) => state.initializeLibrary)

  const isFullscreen = useFullscreenStore((state) => state.isFullscreen)
  const toggleFullscreen = useFullscreenStore((state) => state.toggleFullscreen)
  const setFullscreen = useFullscreenStore((state) => state.setFullscreen)
  const checkFullscreen = useFullscreenStore((state) => state.checkFullscreen)

  useEffect(() => {
    initializeLibrary()
    checkFullscreen()
  }, [initializeLibrary, checkFullscreen])

  const handleSelectAlbum = (albumName: string) => {
    setSelectedAlbumFromSearch(albumName)
    setActiveTab('Albums')
  }

  const handleSelectArtist = (artistName: string) => {
    setSelectedArtistFromSearch(artistName)
    setActiveTab('Artists')
  }

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#090b14] text-white select-none">
      {/* Collapsible Left Sidebar (hidden in true fullscreen) */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && !isFullscreen ? (
          <Sidebar key="sidebar" onCollapse={() => setIsSidebarOpen(false)} />
        ) : null}
      </AnimatePresence>

      {/* Main Content Area */}
      <section
        className={`relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#0b0e18] ${
          activeTab === 'Home' ? 'items-center justify-center' : 'items-center justify-start h-full'
        }`}
      >
        {/* Ambient Video Background & Dark Cinematic Overlay */}
        <AmbientBackground />

        {/* Collapsed Sidebar Floating Navigation: [ Home ] [ Sidebar Expand ] */}
        <AnimatePresence>
          {!isSidebarOpen && !isFullscreen ? (
            <motion.div
              key="collapsed-nav-cluster"
              className="absolute left-6 top-6 z-30 flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Home Navigation Button */}
              <button
                type="button"
                aria-label="Go to Home"
                title="Home"
                className={`grid size-11 place-items-center rounded-xl border border-white/10 bg-[#15111f]/80 shadow-lg backdrop-blur-md transition-colors hover:border-violet-300/30 hover:bg-violet-400/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 cursor-pointer ${
                  activeTab === 'Home'
                    ? 'text-violet-300 border-violet-400/30 bg-violet-400/10'
                    : 'text-white/70'
                }`}
                onClick={() => setActiveTab('Home')}
              >
                <Home className="size-5" strokeWidth={1.7} />
              </button>

              {/* Restore/Expand Sidebar Button */}
              <button
                type="button"
                aria-label="Show sidebar"
                title="Expand sidebar"
                className="grid size-11 place-items-center rounded-xl border border-white/10 bg-[#15111f]/80 text-white/70 shadow-lg backdrop-blur-md transition-colors hover:border-violet-300/30 hover:bg-violet-400/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 cursor-pointer"
                onClick={() => setIsSidebarOpen(true)}
              >
                <PanelLeftOpen className="size-5" strokeWidth={1.7} />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Top-Right Dedicated Fullscreen Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen (F11)' : 'Fullscreen (F11)'}
          title={isFullscreen ? 'Exit fullscreen (F11)' : 'Fullscreen (F11)'}
          className={`absolute top-6 right-6 z-30 grid size-11 place-items-center rounded-xl border border-white/10 bg-[#15111f]/80 shadow-lg backdrop-blur-md transition-colors hover:border-violet-300/30 hover:bg-violet-400/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 cursor-pointer ${
            isFullscreen
              ? 'text-violet-300 border-violet-400/30 bg-violet-400/10'
              : 'text-white/70'
          }`}
        >
          {isFullscreen ? (
            <Minimize2 className="size-5" strokeWidth={1.7} />
          ) : (
            <Maximize2 className="size-5" strokeWidth={1.7} />
          )}
        </button>

        {/* Fullscreen Floating Exit Pill */}
        <AnimatePresence>
          {isFullscreen ? (
            <motion.div
              key="fullscreen-exit-pill"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-5 right-5 z-30 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                aria-label="Exit fullscreen"
                title="Exit fullscreen (Esc / F11)"
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-[#121424]/80 px-3.5 py-1.5 text-xs font-medium text-white/80 shadow-2xl backdrop-blur-xl transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <Minimize2 className="size-3.5" />
                <span>Exit Fullscreen</span>
                <span className="font-mono text-[10px] text-white/40 ml-1">ESC</span>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Primary View Routing */}
        <div
          className={`relative z-10 flex size-full flex-col overflow-hidden ${
            !isSidebarOpen && activeTab !== 'Home' ? 'pt-20 sm:pt-20' : ''
          }`}
        >
          {activeTab === 'Library' ? (
            <LibraryView />
          ) : activeTab === 'Search' ? (
            <SearchView
              onSelectAlbum={handleSelectAlbum}
              onSelectArtist={handleSelectArtist}
            />
          ) : activeTab === 'Playlists' ? (
            <PlaylistsView />
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
            <SettingsView />
          ) : (
            /* Home Screen: VISUALLY FROZEN (Album Artwork + Liquid Glass Player) */
            <div className="flex flex-col items-center justify-center px-4 w-full my-auto -translate-y-1 lg:-translate-y-2">
              <AlbumArtwork />
              <div className="mt-4 lg:mt-5">
                <GlassPlayer />
              </div>
            </div>
          )}
        </div>

        {/* Now Playing Toast Feedback */}
        <NowPlayingToast />

        {/* Playback Queue Drawer Overlay */}
        <QueueDrawer />

        {/* Ambient Mood Selector on Home Screen (available in both Dev & Production, hidden in fullscreen) */}
        {!isFullscreen && activeTab === 'Home' ? <AmbientMoodSelector /> : null}

        {/* Playlist Modals */}
        <CreatePlaylistModal />
        <RenamePlaylistModal />
        <DeletePlaylistModal />
        <AddToPlaylistModal />

        {/* Custom Mood Modals */}
        <CreateCustomMoodModal />
        <RenameCustomMoodModal />
        <RelinkCustomMoodModal />
        <DeleteCustomMoodModal />

        {/* Settings Modals */}
        <ResetSettingsModal />
      </section>
    </main>
  )
}
