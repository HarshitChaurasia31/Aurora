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
import { useNavigationStore } from '../../stores/navigationStore'
import { usePlayerStore } from '../../stores/playerStore'
import { AddMusicButton } from '../library/AddMusicButton'
import type { NavigationTab } from '../../types/navigation'

type NavigationItem = {
  label: NavigationTab
  icon: LucideIcon
}

const navigationItems: NavigationItem[] = [
  { label: 'Home', icon: Home },
  { label: 'Search', icon: Search },
  { label: 'Library', icon: Library },
  { label: 'Liked Songs', icon: Heart },
  { label: 'Artists', icon: UserRound },
  { label: 'Albums', icon: Album },
]

type SidebarProps = {
  onCollapse: () => void
}

export function Sidebar({ onCollapse }: SidebarProps) {
  const activeTab = useNavigationStore((state) => state.activeTab)
  const setActiveTab = useNavigationStore((state) => state.setActiveTab)
  const queue = usePlayerStore((state) => state.queue)
  const toggleQueue = usePlayerStore((state) => state.toggleQueue)

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
          const isActive = activeTab === label

          return (
            <button
              key={label}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.96rem] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${
                isActive
                  ? 'bg-violet-400/[0.11] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                  : 'text-white/55 hover:bg-white/[0.045] hover:text-white/85'
              }`}
              onClick={() => setActiveTab(label)}
            >
              {isActive ? (
                <motion.span
                  layoutId="active-nav"
                  className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-violet-300"
                />
              ) : null}
              <Icon className="size-5 shrink-0" strokeWidth={isActive ? 1.9 : 1.65} />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      {/* Quick Add Music Action in Sidebar */}
      <div className="mt-6 px-1">
        <AddMusicButton className="w-full" size="sm" />
      </div>

      {/* Queue Quick Access Button */}
      <div className="mt-4 px-1">
        <button
          type="button"
          onClick={toggleQueue}
          className="group flex h-10 w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-xs font-medium text-white/70 hover:border-violet-400/30 hover:bg-violet-400/10 hover:text-white transition-all"
        >
          <div className="flex items-center gap-2.5">
            <ListMusic className="size-4 text-violet-300" strokeWidth={1.8} />
            <span>Play Queue</span>
          </div>
          <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-mono text-white/50 group-hover:text-violet-200">
            {queue.length}
          </span>
        </button>
      </div>

      <div className="mt-auto border-t border-white/[0.06] pt-3">
        <button
          type="button"
          aria-current={activeTab === 'Settings' ? 'page' : undefined}
          className={`group relative flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.96rem] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${
            activeTab === 'Settings'
              ? 'bg-violet-400/[0.11] text-white'
              : 'text-white/55 hover:bg-white/[0.045] hover:text-white/85'
          }`}
          onClick={() => setActiveTab('Settings')}
        >
          {activeTab === 'Settings' ? (
            <motion.span
              layoutId="active-nav"
              className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-violet-300"
            />
          ) : null}
          <Settings className="size-5 shrink-0" strokeWidth={activeTab === 'Settings' ? 1.9 : 1.65} />
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
        <path
          d="M12 3c-3.2 3.3-5.5 6.2-5.5 10.1A5.5 5.5 0 0 0 12 18.5a5.5 5.5 0 0 0 5.5-5.4C17.5 9.2 15.2 6.3 12 3Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M9.5 14.5c.5 1.2 1.4 1.8 2.5 2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.6"
        />
      </svg>
    </span>
  )
}
