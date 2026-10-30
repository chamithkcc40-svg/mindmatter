import { Moon, RotateCcw, Sun } from "lucide-react";

interface HeaderProps {
  light: boolean;
  onToggleLight: () => void;
  onReset: () => void;
}

export default function Header({ light, onToggleLight, onReset }: HeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div
        className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-5 lg:px-8"
        style={{
          background:
            "linear-gradient(to bottom, var(--page) 0%, color-mix(in srgb, var(--page) 72%, transparent) 60%, transparent 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* lens mark */}
          <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
            <defs>
              <radialGradient id="lgm" cx="35%" cy="28%" r="85%">
                <stop offset="0%" stopColor={light ? "#ffffff" : "#bcd7ff"} />
                <stop offset="55%" stopColor="#4a7dd6" />
                <stop offset="100%" stopColor="#0a1a3a" />
              </radialGradient>
            </defs>
            <circle cx="16" cy="16" r="13" fill="url(#lgm)" opacity="0.95" />
            <circle cx="16" cy="16" r="13" fill="none" stroke="var(--line)" />
            <ellipse cx="12.4" cy="11.4" rx="4.6" ry="2.6" fill="#fff" opacity="0.5" transform="rotate(-30 12.4 11.4)" />
          </svg>
          <div className="leading-none">
            <span className="block text-[0.8125rem] font-bold tracking-[0.18em] text-[var(--ink)]">
              LIQUID GLASS LAB
            </span>
            <span className="mt-1 hidden text-[0.625rem] tracking-[0.08em] text-[var(--ink-3)] sm:block">
              An Interactive Optical Material Study
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="mono mr-1 hidden text-[0.625rem] tracking-widest text-[var(--ink-3)] md:block">
            WEBGL2 · GLSL
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleLight}
            aria-label={light ? "Switch to dark environment" : "Switch to light environment"}
            title={light ? "Dark environment" : "Light environment"}
          >
            {light ? <Moon size={15} strokeWidth={1.8} /> : <Sun size={15} strokeWidth={1.8} />}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={onReset}
            aria-label="Reset all settings"
            title="Reset all settings"
          >
            <RotateCcw size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
}
