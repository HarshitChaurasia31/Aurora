import {
  Album,
  Heart,
  Home,
  Library,
  ListMusic,
  PanelLeftClose,
  Search,
  Settings,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

type NavigationItem = {
  label: string
  icon: LucideIcon
}

const navigationItems: NavigationItem[] = [
  { label: 'Home', icon: Home },
  { label: 'Search', icon: Search },
  { label: 'Library', icon: Library },
  { label: 'Playlists', icon: ListMusic },
  { label: 'Liked Songs', icon: Heart },
  { label: 'Artists', icon: UserRound },
  { label: 'Albums', icon: Album },
]

type SidebarProps = {
  onCollapse: () => void
}

export function Sidebar({ onCollapse }: SidebarProps) {
  const [activeItem, setActiveItem] = useState('Home')

  return (
    <motion.aside
      aria-label="Main navigation"
      className="relative z-20 flex h-screen w-[240px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0a0b13]/95 px-3 py-5 shadow-[12px_0_40px_rgba(0,0,0,0.16)] backdrop-blur-xl"
      initial={{ width: 0, opacity: 0, x: -28 }}
      animate={{ width: 240, opacity: 1, x: 0 }}
      exit={{ width: 0, opacity: 0, x: -28 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex h-12 items-center justify-between px-3">
        <div className="flex items-center gap-2.5">
          <AuroraMark />
          <span className="text-[1.35rem] font-medium tracking-[0.13em] text-white/85">AURORA</span>
        </div>
        <button
          type="button"
          aria-label="Collapse sidebar"
          className="grid size-8 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
          onClick={onCollapse}
        >
          <PanelLeftClose className="size-[18px]" strokeWidth={1.7} />
        </button>
      </div>

      <nav className="mt-10 space-y-1" aria-label="Aurora sections">
        {navigationItems.map(({ label, icon: Icon }) => {
          const isActive = activeItem === label

          return (
            <button
              key={label}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.96rem] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${
                isActive ? 'bg-violet-400/[0.11] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' : 'text-white/55 hover:bg-white/[0.045] hover:text-white/85'
              }`}
              onClick={() => setActiveItem(label)}
            >
              {isActive ? <motion.span layoutId="active-nav" className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-violet-300" /> : null}
              <Icon className="size-5 shrink-0" strokeWidth={isActive ? 1.9 : 1.65} />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-white/[0.06] pt-3">
        <button
          type="button"
          aria-current={activeItem === 'Settings' ? 'page' : undefined}
          className={`group relative flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.96rem] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${
            activeItem === 'Settings' ? 'bg-violet-400/[0.11] text-white' : 'text-white/55 hover:bg-white/[0.045] hover:text-white/85'
          }`}
          onClick={() => setActiveItem('Settings')}
        >
          {activeItem === 'Settings' ? <motion.span layoutId="active-nav" className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-violet-300" /> : null}
          <Settings className="size-5 shrink-0" strokeWidth={activeItem === 'Settings' ? 1.9 : 1.65} />
          <span>Settings</span>
        </button>
      </div>
    </motion.aside>
  )
}

function AuroraMark() {
  return (
    <span className="grid size-7 place-items-center rounded-lg border border-violet-300/25 bg-violet-400/10 text-violet-300">
      <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none">
        <path d="M12 3c-3.2 3.3-5.5 6.2-5.5 10.1A5.5 5.5 0 0 0 12 18.5a5.5 5.5 0 0 0 5.5-5.4C17.5 9.2 15.2 6.3 12 3Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9.5 14.5c.5 1.2 1.4 1.8 2.5 2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      </svg>
    </span>
  )
}
