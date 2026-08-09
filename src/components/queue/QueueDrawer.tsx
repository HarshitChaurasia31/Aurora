import { ArrowDown, ArrowUp, Disc3, ListMusic, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '../../stores/playerStore'
import { formatTime } from '../../utils/formatTime'

export function QueueDrawer() {
  const isQueueOpen = usePlayerStore((state) => state.isQueueOpen)
  const setQueueOpen = usePlayerStore((state) => state.setQueueOpen)
  const queue = usePlayerStore((state) => state.queue)
  const currentIndex = usePlayerStore((state) => state.currentIndex)
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const playTrack = usePlayerStore((state) => state.playTrack)
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue)
  const moveQueueItem = usePlayerStore((state) => state.moveQueueItem)
  const clearQueue = usePlayerStore((state) => state.clearQueue)

  if (!isQueueOpen) return null

  const upNextTracks = queue.slice(currentIndex >= 0 ? currentIndex + 1 : 0)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => setQueueOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Drawer Panel */}
        <motion.aside
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex h-full w-88 sm:w-96 flex-col border-l border-white/[0.08] bg-[#0c0e18]/95 p-5 shadow-2xl backdrop-blur-2xl"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-2.5">
              <ListMusic className="size-4.5 text-violet-300" strokeWidth={1.8} />
              <h2 className="text-sm font-semibold tracking-wide text-white/95 uppercase">
                Play Queue
              </h2>
              <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-mono text-white/50">
                {queue.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {queue.length > 1 ? (
                <button
                  type="button"
                  onClick={clearQueue}
                  title="Clear Queue"
                  className="grid size-7 place-items-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-rose-300 transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setQueueOpen(false)}
                className="grid size-7 place-items-center rounded-lg text-white/50 hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-6">
            {/* NOW PLAYING CARD */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-2">
                Now Playing
              </h3>

              {currentTrack ? (
                <div className="flex items-center gap-3 rounded-xl border border-violet-400/25 bg-violet-400/[0.08] p-3 shadow-sm">
                  <div className="relative grid size-11 shrink-0 place-items-center rounded-lg overflow-hidden border border-white/10 bg-[#07080f]">
                    {currentTrack.artworkUrl ? (
                      <img src={currentTrack.artworkUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <Disc3 className="size-5 text-violet-300/60" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white/95">
                      {currentTrack.title}
                    </p>
                    <p className="truncate text-[11px] text-white/50 mt-0.5">{currentTrack.artist}</p>
                  </div>

                  {isPlaying ? (
                    <div className="flex items-end gap-0.5 h-3.5 w-3.5 justify-center mr-1">
                      <span className="w-0.5 bg-violet-300 animate-[bounce_0.8s_ease-in-out_infinite] h-full" />
                      <span className="w-0.5 bg-violet-300 animate-[bounce_1.1s_ease-in-out_infinite] h-2/3" />
                      <span className="w-0.5 bg-violet-300 animate-[bounce_0.9s_ease-in-out_infinite] h-4/5" />
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-white/35 italic">No track playing</p>
              )}
            </div>

            {/* UP NEXT LIST */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  Up Next ({upNextTracks.length})
                </h3>
              </div>

              {upNextTracks.length === 0 ? (
                <p className="text-xs text-white/35 italic py-2">Queue is empty</p>
              ) : (
                <div className="divide-y divide-white/[0.03] rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  {upNextTracks.map((track, relativeIdx) => {
                    const actualIdx = (currentIndex >= 0 ? currentIndex + 1 : 0) + relativeIdx

                    return (
                      <div
                        key={`${track.id}_${actualIdx}`}
                        className="group flex items-center gap-2.5 p-2.5 hover:bg-white/[0.04] transition-colors"
                      >
                        {/* Track click to jump */}
                        <div
                          onClick={() => playTrack(track, queue)}
                          className="flex min-w-0 flex-1 items-center gap-2.5 cursor-pointer"
                        >
                          <div className="relative grid size-8 shrink-0 place-items-center rounded-md overflow-hidden border border-white/10 bg-[#07080f]">
                            {track.artworkUrl ? (
                              <img src={track.artworkUrl} alt="" className="size-full object-cover" />
                            ) : (
                              <Disc3 className="size-3.5 text-violet-300/40" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-white/90 group-hover:text-violet-200">
                              {track.title}
                            </p>
                            <p className="truncate text-[10px] text-white/40">{track.artist}</p>
                          </div>

                          <span className="font-mono text-[10px] text-white/35 pr-1">
                            {formatTime(track.duration)}
                          </span>
                        </div>

                        {/* Controls: Move Up / Down / Remove */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {relativeIdx > 0 ? (
                            <button
                              type="button"
                              onClick={() => moveQueueItem(actualIdx, actualIdx - 1)}
                              title="Move Up"
                              className="grid size-6 place-items-center rounded text-white/40 hover:bg-white/[0.08] hover:text-white"
                            >
                              <ArrowUp className="size-3" />
                            </button>
                          ) : null}

                          {relativeIdx < upNextTracks.length - 1 ? (
                            <button
                              type="button"
                              onClick={() => moveQueueItem(actualIdx, actualIdx + 1)}
                              title="Move Down"
                              className="grid size-6 place-items-center rounded text-white/40 hover:bg-white/[0.08] hover:text-white"
                            >
                              <ArrowDown className="size-3" />
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => removeFromQueue(actualIdx)}
                            title="Remove"
                            className="grid size-6 place-items-center rounded text-white/40 hover:bg-white/[0.08] hover:text-rose-300"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  )
}
