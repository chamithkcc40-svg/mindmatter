import { RotateCcw } from "lucide-react";
import { ENVS, type MaterialParams, type SceneSettings } from "../lib/presets";
import { PanelSection, Segmented, Slider, Toggle } from "./controls";

interface ControlPanelProps {
  material: MaterialParams;
  scene: SceneSettings;
  onMaterial: (patch: Partial<MaterialParams>) => void;
  onScene: (patch: Partial<SceneSettings>) => void;
  onReset: () => void;
}

export default function ControlPanel({
  material,
  scene,
  onMaterial,
  onScene,
  onReset,
}: ControlPanelProps) {
  return (
    <div className="ui-panel rounded-2xl p-4">
      <div className="space-y-4">
        {/* OPTICS */}
        <section>
          <PanelSection title="Optics" />
          <div className="space-y-2.5">
            <Slider
              label="Refraction strength"
              value={material.strength}
              min={0}
              max={1.6}
              onChange={(v) => onMaterial({ strength: v })}
            />
            <Slider
              label="Refractive index (IOR)"
              value={material.ior}
              min={1.0}
              max={2.2}
              onChange={(v) => onMaterial({ ior: v })}
              format={(v) => v.toFixed(2)}
            />
            <Slider
              label="Surface curvature"
              value={material.curvature}
              min={0.15}
              max={1.5}
              onChange={(v) => onMaterial({ curvature: v })}
            />
            <Slider
              label="Apparent thickness"
              value={material.thickness}
              min={0.1}
              max={2}
              onChange={(v) => onMaterial({ thickness: v })}
            />
          </div>
          <div className="mt-2.5 border-t border-[var(--line-soft)] pt-2">
            <Toggle
              label="Refraction"
              hint="Disables geometric background displacement"
              checked={scene.compare !== "off"}
              onChange={(v) => onScene({ compare: v ? "on" : "off" })}
            />
          </div>
        </section>

        {/* LIGHT */}
        <section className="border-t border-[var(--line-soft)] pt-3.5">
          <PanelSection title="Light" />
          <div className="space-y-2.5">
            <Slider
              label="Reflection intensity"
              value={material.reflect}
              min={0}
              max={1.3}
              onChange={(v) => onMaterial({ reflect: v })}
            />
            <Slider
              label="Edge highlight"
              value={material.edge}
              min={0}
              max={2}
              onChange={(v) => onMaterial({ edge: v })}
            />
          </div>
          <div className="mt-2.5 border-t border-[var(--line-soft)] pt-2">
            <Toggle
              label="Chromatic aberration"
              hint="Dispersion — per-channel refraction offsets"
              checked={material.chroma}
              onChange={(v) => onMaterial({ chroma: v })}
            />
          </div>
        </section>

        {/* STAGE */}
        <section className="border-t border-[var(--line-soft)] pt-3.5">
          <PanelSection title="Stage" />
          <div className="mb-3 grid grid-cols-4 gap-1.5">
            {ENVS.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => onScene({ env: e.id })}
                data-active={scene.env === e.id}
                className="preset-pill !rounded-lg !px-1 !py-2 text-center !text-[0.5625rem] !tracking-[0.1em]"
                title={e.label}
              >
                {e.short}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <Toggle
              label="Background animation"
              checked={scene.animate}
              onChange={(v) => onScene({ animate: v })}
            />
            <Toggle
              label="Auto-rotation"
              checked={scene.autoRotate}
              onChange={(v) => onScene({ autoRotate: v })}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[0.6875rem] font-medium tracking-wide text-[var(--ink-2)]">
              Render resolution
            </span>
            <Segmented
              options={[
                { value: "eco", label: "1×" },
                { value: "balanced", label: "1.5×" },
                { value: "high", label: "2×" },
              ]}
              value={scene.quality}
              onChange={(v) => onScene({ quality: v })}
            />
          </div>
        </section>

        <button
          type="button"
          onClick={onReset}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line-soft)] bg-[var(--field)] py-2.5 text-[0.6875rem] font-semibold tracking-[0.12em] text-[var(--ink-2)] transition-colors hover:border-[var(--line)] hover:text-[var(--ink)]"
        >
          <RotateCcw size={12} strokeWidth={2} />
          RESET ALL SETTINGS
        </button>
      </div>
    </div>
  );
}
