export default function Footer() {
  return (
    <footer className="border-t border-[var(--line-soft)]">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-3 px-4 py-8 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true">
            <defs>
              <radialGradient id="lgf" cx="35%" cy="28%" r="85%">
                <stop offset="0%" stopColor="#bcd7ff" />
                <stop offset="55%" stopColor="#4a7dd6" />
                <stop offset="100%" stopColor="#0a1a3a" />
              </radialGradient>
            </defs>
            <circle cx="16" cy="16" r="14" fill="url(#lgf)" />
          </svg>
          <span className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--ink-2)]">
            LIQUID GLASS LAB
          </span>
        </div>
        <p className="text-[0.625rem] tracking-[0.08em] text-[var(--ink-3)]">
          WebGL2 · GLSL 3.00 · Raw screen-space optics — no glassmorphism shortcuts
        </p>
        <span className="mono text-[0.625rem] tracking-widest text-[var(--ink-3)]">v1.0 · 60 FPS TARGET</span>
      </div>
    </footer>
  );
}
