import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { GlassEngine, type EngineOpts } from "../webgl/engine";
import type { MaterialParams } from "../lib/presets";
import { Slider, Toggle, Segmented } from "./controls";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function useEngine(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  material: MaterialParams,
  opts: EngineOpts
): RefObject<GlassEngine | null> {
  const ref = useRef<GlassEngine | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new GlassEngine(canvas, material, opts);
    ref.current = engine;
    return () => {
      engine.dispose();
      ref.current = null;
    };
    // engine memoised config is stable by design
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}

function Card({
  index,
  title,
  formula,
  children,
  canvas,
  note,
}: {
  index: string;
  title: string;
  formula: string;
  children: ReactNode;
  canvas: ReactNode;
  note: string;
}) {
  return (
    <div className="ui-panel overflow-hidden rounded-2xl">
      <div className="relative">{canvas}</div>
      <div className="p-5">
        <div className="flex items-baseline gap-3">
          <span className="mono text-[0.625rem] tracking-[0.2em] text-[var(--accent-ink)]">
            {index}
          </span>
          <h3 className="text-[0.9375rem] font-semibold tracking-wide text-[var(--ink)]">
            {title}
          </h3>
          <span className="mono ml-auto hidden text-[0.625rem] text-[var(--ink-3)] sm:block">
            {formula}
          </span>
        </div>
        <p className="mt-2 text-[0.75rem] leading-relaxed text-[var(--ink-2)]">{note}</p>
        <div className="mt-4 space-y-2.5 border-t border-[var(--line-soft)] pt-4">{children}</div>
      </div>
    </div>
  );
}

const canvasWrap =
  "relative aspect-[4/3] w-full overflow-hidden border-b border-[var(--line-soft)]";

/* ------------------------------------------------------------------ */
/* Experiment 1 — Refraction                                           */
/* ------------------------------------------------------------------ */

function RefractionLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strength, setStrength] = useState(1.15);
  const [ior, setIor] = useState(1.62);
  const [on, setOn] = useState(true);

  const engine = useEngine(
    canvasRef,
    {
      ...BASE_MATERIAL,
      strength,
      ior,
      reflect: 0.55,
      edge: 0.7,
      chroma: true,
    },
    {
      env: "geometric",
      interactive: true,
      camDist: 3.6,
      fovDeg: 36,
      maxDpr: 1.75,
      bodies: [{ kind: "sphere", pos: [0, 0, 0], scale: 1.02, floatAmp: 0, floatSpeed: 0, phase: 0 }],
    }
  );

  useEffect(() => {
    engine.current?.setMaterial({ strength, ior });
  }, [engine, strength, ior]);
  useEffect(() => {
    engine.current?.setCompare(on ? "on" : "off");
  }, [engine, on]);

  return (
    <Card
      index="EXP—01"
      title="Geometric refraction"
      formula="n₁·sinθ₁ = n₂·sinθ₂"
      note="A high-index sphere in front of a precision engineering plate. Snell-based ray bending displaces every line that passes through the lens — toggle refraction off and the displacement vanishes. This is spatial distortion, not blur."
      canvas={
        <div className={canvasWrap}>
          <canvas ref={canvasRef} className="gl-canvas absolute inset-0" />
        </div>
      }
    >
      <Toggle label="Refraction" checked={on} onChange={setOn} />
      <Slider label="Refraction strength" value={strength} min={0} max={1.6} onChange={setStrength} />
      <Slider label="Refractive index" value={ior} min={1.0} max={2.2} onChange={setIor} />
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Experiment 2 — Fresnel edge response                                */
/* ------------------------------------------------------------------ */

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function FresnelLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [f0, setF0] = useState(0.04);
  const [edge, setEdge] = useState(1.5);
  const [reflect, setReflect] = useState(1.0);
  const [spin, setSpin] = useState(() => !reducedMotion());

  const engine = useEngine(
    canvasRef,
    {
      ...BASE_MATERIAL,
      strength: 0.42,
      curvature: 0.5,
      thickness: 0.85,
      absorb: 0.05,
      chroma: false,
      f0,
      edge,
      reflect,
    },
    {
      env: "studio",
      interactive: true,
      autoRotate: !reducedMotion(),
      camDist: 4.1,
      fovDeg: 34,
      maxDpr: 1.75,
      rotY: 0.4,
      bodies: [{ kind: "dome", pos: [0, 0, 0], scale: 1.02, floatAmp: 0, floatSpeed: 0, phase: 0 }],
    }
  );

  useEffect(() => {
    engine.current?.setMaterial({ f0, edge, reflect });
  }, [engine, f0, edge, reflect]);
  useEffect(() => {
    engine.current?.setAutoRotate(spin);
  }, [engine, spin]);

  return (
    <Card
      index="EXP—02"
      title="Fresnel & edge response"
      formula="F = F₀ + (1−F₀)(1−N·V)⁵"
      note="Reflectance obeys the viewing angle: face-on it stays near F₀, while grazing angles approach a mirror. Rotate the lens (drag, or leave auto-spin on) and watch the reflective band travel across the curvature."
      canvas={
        <div className={canvasWrap}>
          <canvas ref={canvasRef} className="gl-canvas absolute inset-0" />
        </div>
      }
    >
      <Toggle label="Auto-rotation" checked={spin} onChange={setSpin} />
      <Slider
        label="Base reflectance F₀"
        value={f0}
        min={0.01}
        max={0.3}
        onChange={setF0}
        format={(v) => v.toFixed(3)}
      />
      <Slider label="Edge highlight" value={edge} min={0} max={2.5} onChange={setEdge} />
      <Slider label="Reflection intensity" value={reflect} min={0} max={1.3} onChange={setReflect} />
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Experiment 3 — Thickness & absorption                               */
/* ------------------------------------------------------------------ */

const TINTS: { id: string; label: string; tint: [number, number, number] }[] = [
  { id: "clear", label: "CLEAR", tint: [0.97, 0.97, 0.97] },
  { id: "cool", label: "COOL", tint: [0.5, 0.72, 0.95] },
  { id: "amber", label: "AMBER", tint: [0.95, 0.7, 0.42] },
];

function AbsorptionLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thickness, setThickness] = useState(1.1);
  const [absorb, setAbsorb] = useState(1.1);
  const [tintId, setTintId] = useState("cool");

  const tint = TINTS.find((t) => t.id === tintId)!.tint;

  const engine = useEngine(
    canvasRef,
    {
      ...BASE_MATERIAL,
      strength: 0.38,
      curvature: 0.68,
      thickness,
      absorb,
      tint: [...tint] as [number, number, number],
      reflect: 0.32,
      edge: 0.5,
      chroma: false,
    },
    {
      env: "light",
      interactive: true,
      camDist: 4.1,
      fovDeg: 34,
      maxDpr: 1.75,
      bodies: [{ kind: "dome", pos: [0, 0, 0], scale: 1.02, floatAmp: 0, floatSpeed: 0, phase: 0 }],
    }
  );

  useEffect(() => {
    engine.current?.setMaterial({ thickness, absorb, tint: [...tint] as [number, number, number] });
  }, [engine, thickness, absorb, tintId]); // eslint-disable-line react-hooks/exhaustive-deps

  // analytic readout: Beer–Lambert transmittance at the crown (ndv≈1, vT≈1)
  const curvature = 0.68;
  const path = thickness * 1.9 * (0.45 + 0.55 * curvature);
  const avgT =
    tint.reduce((acc, c) => acc + Math.exp(-(1 - c) * absorb * path), 0) / 3;

  return (
    <Card
      index="EXP—03"
      title="Thickness & absorption"
      formula="T = e^(−σ·d)"
      note="Beer–Lambert attenuation along the apparent optical path. The crown is thickest, grazing rays travel furthest — so edges deepen first. The readout is computed from the same approximation the shader uses."
      canvas={
        <div className={canvasWrap}>
          <canvas ref={canvasRef} className="gl-canvas absolute inset-0" />
        </div>
      }
    >
      <div className="flex items-center justify-between">
        <span className="text-[0.6875rem] font-medium tracking-wide text-[var(--ink-2)]">Tint</span>
        <Segmented options={TINTS.map((t) => ({ value: t.id, label: t.label }))} value={tintId} onChange={setTintId} />
      </div>
      <Slider label="Apparent thickness" value={thickness} min={0.1} max={2.4} onChange={setThickness} />
      <Slider label="Absorption coefficient σ" value={absorb} min={0} max={3} onChange={setAbsorb} />
      <div className="flex items-center justify-between rounded-lg bg-[var(--field)] px-3 py-2">
        <span className="text-[0.625rem] tracking-[0.14em] text-[var(--ink-3)]">
          CROWN TRANSMITTANCE
        </span>
        <span className="mono text-[0.75rem] text-[var(--ink)]">{(avgT * 100).toFixed(1)}%</span>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

const BASE_MATERIAL: MaterialParams = {
  ior: 1.45,
  strength: 0.9,
  curvature: 0.9,
  thickness: 1,
  reflect: 0.7,
  edge: 1,
  chroma: false,
  frost: 0,
  absorb: 0.1,
  tint: [0.9, 0.95, 1],
  f0: 0.04,
};

export default function ExperimentsSection() {
  return (
    <section className="relative mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="micro-label mb-3 flex items-center gap-2">
            <span className="inline-block h-px w-8 bg-[var(--accent)]" />
            Controlled demonstrations
          </p>
          <h2 className="display-tight text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
            Optical Experiments
          </h2>
        </div>
        <p className="max-w-sm text-[0.75rem] leading-relaxed text-[var(--ink-2)]">
          Three isolated studies on the renderer&apos;s core behaviours. Every experiment runs the
          same two-pass pipeline as the hero lens.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <RefractionLab />
        <FresnelLab />
        <AbsorptionLab />
      </div>
    </section>
  );
}
