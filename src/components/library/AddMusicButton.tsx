import { FileMusic, FolderPlus, Plus } from 'lucide-react'
import { useState } from 'react'
import { importAudioFolder, importSingleAudioFile } from '../../features/importer/fileImporter'

interface AddMusicButtonProps {
  className?: string
  size?: 'sm' | 'md'
}

export function AddMusicButton({ className = '', size = 'md' }: AddMusicButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleAddSong = async () => {
    setIsOpen(false)
    setIsImporting(true)
    try {
      await importSingleAudioFile()
    } finally {
      setIsImporting(false)
    }
  }

  const handleAddFolder = async () => {
    setIsOpen(false)
    setIsImporting(true)
    try {
      await importAudioFolder()
    } finally {
      setIsImporting(false)
    }
  }

  const isSmall = size === 'sm'

  return (
    <div className={`relative inline-block text-left select-none ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={isImporting}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group inline-flex items-center gap-2 rounded-xl font-medium tracking-tight text-white transition-all shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${
          isSmall
            ? 'px-3 py-1.5 text-xs bg-white/[0.08] hover:bg-white/[0.12] border border-white/10'
            : 'px-4 py-2 text-sm bg-gradient-to-br from-violet-500/80 to-violet-600/90 hover:from-violet-400 hover:to-violet-500 border border-violet-300/30 shadow-violet-500/20'
        }`}
      >
        <Plus className={isSmall ? 'size-3.5' : 'size-4'} strokeWidth={2} />
        <span>{isImporting ? 'Scanning...' : 'Add Music'}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen ? (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            role="menu"
            aria-label="Add music options"
            className="absolute right-0 mt-2 z-40 w-44 rounded-xl border border-white/10 bg-[#0f111c]/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleAddSong}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-white/80 transition-colors hover:bg-violet-400/[0.12] hover:text-white"
            >
              <FileMusic className="size-4 text-violet-300" strokeWidth={1.8} />
              <span>Add Song</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleAddFolder}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-white/80 transition-colors hover:bg-violet-400/[0.12] hover:text-white"
            >
              <FolderPlus className="size-4 text-violet-300" strokeWidth={1.8} />
              <span>Add Folder</span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
