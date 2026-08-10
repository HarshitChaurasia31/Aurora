import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Home, PanelLeftOpen } from 'lucide-react'
import { Sidebar } from '../components/sidebar/Sidebar'
import { AmbientBackground } from '../components/ambient/AmbientBackground'
import { AmbientDevSwitcher } from '../components/ambient/AmbientDevSwitcher'
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
import { useGlobalKeyboardShortcuts } from '../hooks/useGlobalKeyboardShortcuts'

export function AppShell() {
  useGlobalKeyboardShortcuts()
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
    <main className="flex h-screen w-screen overflow-hidden bg-[#090b14] text-white select-none">
      {/* Collapsible Left Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarOpen ? <Sidebar key="sidebar" onCollapse={() => setIsSidebarOpen(false)} /> : null}
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
          {!isSidebarOpen ? (
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

        {/* View Switcher Container with Collapsed Sidebar Clearance */}
        <div
          className={`relative z-10 flex size-full flex-1 flex-col items-center overflow-hidden transition-all duration-250 ${
            !isSidebarOpen && activeTab !== 'Home' ? 'pl-32 sm:pl-36' : ''
          }`}
        >
          {activeTab === 'Library' ? (
            <LibraryView />
          ) : activeTab === 'Playlists' ? (
            <PlaylistsView />
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

        {/* Ambient Mood Switcher (import.meta.env.DEV only) */}
        <AmbientDevSwitcher />

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
