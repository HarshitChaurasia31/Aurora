export function AppShell() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#080a12] text-white">
      <div className="aurora-glow" aria-hidden="true" />
      <section className="relative z-10 text-center">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl border border-violet-300/25 bg-violet-400/10 shadow-[0_0_48px_rgba(139,92,246,0.18)]">
          <svg aria-hidden="true" className="size-7 text-violet-300" viewBox="0 0 24 24" fill="none">
            <path d="M12 3c-3.2 3.3-5.5 6.2-5.5 10.1A5.5 5.5 0 0 0 12 18.5a5.5 5.5 0 0 0 5.5-5.4C17.5 9.2 15.2 6.3 12 3Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9.5 14.5c.5 1.2 1.4 1.8 2.5 2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          </svg>
        </div>
        <p className="text-4xl font-medium tracking-[0.24em] text-white/90">AURORA</p>
        <p className="mt-4 text-sm tracking-wide text-white/50">Your music. Your atmosphere.</p>
        <p className="mt-10 text-xs text-white/30">Phase 1 foundation</p>
      </section>
    </main>
  )
}
