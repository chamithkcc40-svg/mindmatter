import { cn } from "../utils/cn";

/* ---------- Slider ---------- */
interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}

export function Slider({ label, value, min, max, step = 0.01, onChange, format }: SliderProps) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <label className="block select-none">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[0.6875rem] font-medium tracking-wide text-[var(--ink-2)]">
          {label}
        </span>
        <span className="mono text-[0.6875rem] text-[var(--ink)]">
          {format ? format(value) : value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        className="lab-slider"
        style={{ ["--fill" as string]: `${fill}%` }}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </label>
  );
}

/* ---------- Toggle ---------- */
interface ToggleProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ label, hint, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center justify-between py-1 text-left"
    >
      <span>
        <span className="block text-[0.6875rem] font-medium tracking-wide text-[var(--ink-2)] transition-colors group-hover:text-[var(--ink)]">
          {label}
        </span>
        {hint && <span className="mt-0.5 block text-[0.625rem] text-[var(--ink-3)]">{hint}</span>}
      </span>
      <span className="lab-toggle" data-on={checked} aria-hidden="true" />
    </button>
  );
}

/* ---------- Segmented ---------- */
interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

export function Segmented<T extends string>({ options, value, onChange, className }: SegmentedProps<T>) {
  return (
    <div className={cn("lab-segmented", className)} role="group">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          data-active={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Section label ---------- */
export function PanelSection({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <span className="micro-label">{title}</span>
      {right}
    </div>
  );
}
