import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

interface ScrollToTopButtonProps {
  visible: boolean
  onClick: () => void
}

export function ScrollToTopButton({ visible, onClick }: ScrollToTopButtonProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          onClick={onClick}
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          aria-label="Scroll to top"
          title="Scroll to top"
          className="fixed bottom-7 right-7 z-30 flex items-center gap-1.5 rounded-full border border-white/15 bg-[#0f111f]/90 px-3.5 py-2 text-xs font-medium text-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-colors hover:border-violet-400/40 hover:bg-violet-500/20 hover:text-white"
        >
          <ArrowUp className="size-3.5 stroke-[2]" />
          <span className="font-mono text-[11px]">Top</span>
        </motion.button>
      ) : null}
    </AnimatePresence>
  )
}
