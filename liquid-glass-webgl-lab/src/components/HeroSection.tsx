import { useEffect, useRef, useState } from "react";
import { Move, RotateCcw } from "lucide-react";
import { GlassEngine } from "../webgl/engine";
import {
  DEFAULT_MATERIAL,
  DEFAULT_SCENE,
  PRESETS,
  ENVS,
  type CompareMode,
  type MaterialParams,
  type SceneSettings,
} from "../lib/presets";
import { Segmented } from "./controls";

interface HeroSectionProps {
  material: MaterialParams;
  scene: SceneSettings;
  activePreset: string | null;
  onPreset: (id: string) => void;
  onScene: (patch: Partial<SceneSettings>) => void;
  registerEngine: (e: GlassEngine | null) => void;
  onGlError: (msg: string) => void;
  panel: React.ReactNode;
}

export default function HeroSection({
  material,
  scene,
  activePreset,
  onPreset,
  onScene,
  registerEngine,
  onGlError,
  panel,
}: HeroSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GlassEngine | null>(null);
  const [split, setSplit] = useState(0.5);
  const [failed, setFailed] = useState<string | null>(null);

  /* engine lifecycle — created once */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new GlassEngine(canvas, DEFAULT_MATERIAL, {
      env: DEFAULT_SCENE.env,
      interactive: true,
      camDist: 4.6,
      fovDeg: 34,
      animate: DEFAULT_SCENE.animate,
      autoRotate: DEFAULT_SCENE.autoRotate,
      rotX: -0.06,
      bodies: [
        { kind: "dome", pos: [-0.1, 0.05, 0], scale: 0.88, floatAmp: 0.02, floatSpeed: 0.5, phase: 0 },
        { kind: "sphere", pos: [1.32, 0.58, -0.95], scale: 0.23, floatAmp: 0.055, floatSpeed: 0.72, phase: 1.7 },
        { kind: "sphere", pos: [-1.62, -0.68, -0.6], scale: 0.15, floatAmp: 0.045, floatSpeed: 0.92, phase: 4.1 },
      ],
      onError: (msg) => {
        setFailed(msg);
        onGlError(msg);
      },
    });
    engineRef.current = engine;
    registerEngine(engine);
    return () => {
      engine.dispose();
      engineRef.current = null;
      registerEngine(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* push state → engine (no React re-render loop involved) */
  useEffect(() => {
    engineRef.current?.setMaterial(material);
  }, [material]);
  useEffect(() => {
    engineRef.current?.setEnv(scene.env);
  }, [scene.env]);
  useEffect(() => {
    engineRef.current?.setAnimate(scene.animate);
  }, [scene.animate]);
  useEffect(() => {
    engineRef.current?.setAutoRotate(scene.autoRotate);
  }, [scene.autoRotate]);
  useEffect(() => {
    engineRef.current?.setQuality(scene.quality);
  }, [scene.quality]);
  useEffect(() => {
    engineRef.current?.setCompare(scene.compare, split);
  }, [scene.compare, split]);

  /* draggable split divider */
  const dragRef = useRef<{ active: boolean }>({ active: false });
  const onSplitDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current.active = true;
  };
  const onSplitMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    e.stopPropagation();
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    setSplit(Math.min(0.94, Math.max(0.06, (e.clientX - r.left) / r.width)));
  };
  const onSplitUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    dragRef.current.active = false;
  };

  const envDef = ENVS.find((e) => e.id === scene.env)!;
  const presetLabel = activePreset
    ? PRESETS.find((p) => p.id === activePreset)?.label ?? "CUSTOM"
    : "CUSTOM";

  return (
    <section className="relative lg:h-[100svh] lg:min-h-[660px]">
      {/* -------- stage (canvas + overlays) -------- */}
      <div
        ref={stageRef}
        className="relative h-[72svh] min-h-[470px] overflow-hidden lg:absolute lg:inset-0 lg:h-auto"
      >
        {failed ? (
          <div className="flex h-full items-center justify-center bg-[var(--page-2)] px-6 text-center">
            <div className="max-w-sm">
              <p className="text-sm font-semibold text-[var(--ink)]">Renderer unavailable</p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--ink-2)]">{failed}</p>
              <p className="mt-3 text-[0.6875rem] text-[var(--ink-3)]">
                This demonstration requires WebGL2. Please try a current version of Chrome, Edge,
                Firefox or Safari.
              </p>
            </div>
          </div>
        ) : (
          <canvas ref={canvasRef} className="gl-canvas absolute inset-0" />
        )}

        {/* legibility gradient */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-56"
          style={{ background: "linear-gradient(to top, color-mix(in srgb, var(--page) 72%, transparent), transparent)" }}
        />

        {/* split divider */}
        {scene.compare === "split" && !failed && (
          <>
            <div
              className="absolute inset-y-0 z-20 w-10 -translate-x-1/2 cursor-ew-resize"
              style={{ left: `${split * 100}%` }}
              onPointerDown={onSplitDown}
              onPointerMove={onSplitMove}
              onPointerUp={onSplitUp}
              onPointerCancel={onSplitUp}
            >
              <div className="absolute inset-y-0 left-1/2 w-px bg-white/70 mix-blend-difference" />
              <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 backdrop-blur-md">
                <Move size={13} className="text-white/85" />
              </div>
            </div>
            <span
              className="mono pointer-events-none absolute top-[176px] z-10 -translate-x-full rounded-md bg-black/45 px-2 py-1 text-[0.5625rem] tracking-[0.14em] text-white/80 backdrop-blur-sm"
              style={{ left: `calc(${split * 100}% - 14px)` }}
            >
              0.00× — RAW
            </span>
            <span
              className="mono pointer-events-none absolute top-[176px] z-10 translate-x-0 rounded-md bg-black/45 px-2 py-1 text-[0.5625rem] tracking-[0.14em] text-white/80 backdrop-blur-sm"
              style={{ left: `calc(${split * 100}% + 14px)` }}
            >
              {material.strength.toFixed(2)}× — REFRACTED
            </span>
          </>
        )}

        {/* compare + reset-view cluster */}
        <div className="absolute left-1/2 top-[70px] z-20 flex -translate-x-1/2 flex-col items-center gap-2 lg:top-20">
          <span className="micro-label hidden sm:block">Refraction proof</span>
          <div className="flex items-center gap-2">
            <Segmented
              options={[
                { value: "on", label: "ON" },
                { value: "off", label: "OFF" },
                { value: "split", label: "SPLIT" },
              ]}
              value={scene.compare}
              onChange={(v: CompareMode) => onScene({ compare: v })}
            />
            <button
              type="button"
              className="icon-btn"
              title="Reset view"
              aria-label="Reset view"
              onClick={() => engineRef.current?.resetView()}
            >
              <RotateCcw size={13} strokeWidth={1.9} />
            </button>
          </div>
          <span className="pointer-events-none flex items-center gap-1.5 text-[0.5625rem] tracking-[0.18em] text-[var(--ink-3)]">
            <Move size={10} />
            DRAG TO ROTATE · MOVE CURSOR TO LIGHT
          </span>
        </div>

        {/* title block */}
        <div className="pointer-events-none absolute bottom-[84px] left-5 z-10 max-w-xl lg:left-10 lg:bottom-[92px]">
          <p className="micro-label rise mb-3 flex items-center gap-2">
            <span className="inline-block h-1 w-1 rounded-full bg-[var(--accent)]" />
            Live WebGL2 · Shader-driven optics
          </p>
          <h1 className="display-tight rise text-[2.6rem] font-semibold leading-[0.98] text-[var(--ink)] sm:text-6xl lg:text-7xl" style={{ animationDelay: "0.08s" }}>
            Liquid Glass,
            <br />
            <span className="text-[var(--ink-2)]">rendered honestly.</span>
          </h1>
          <p className="rise mt-4 hidden max-w-md text-[0.8125rem] leading-relaxed text-[var(--ink-2)] md:block" style={{ animationDelay: "0.16s" }}>
            A curved optical surface refracting a live environment texture through Snell-based
            screen-space refraction — with Schlick Fresnel edges, Beer–Lambert absorption and
            per-channel dispersion. Drag the lens. Split the proof.
          </p>
        </div>

        {/* material info panel */}
        <div className="ui-panel absolute bottom-[76px] right-5 z-10 hidden w-[218px] rounded-xl p-3.5 md:block lg:bottom-auto lg:right-auto lg:left-10 lg:top-[72px]">
          <div className="mb-2 flex items-center justify-between">
            <span className="micro-label">Material</span>
            <span className="mono text-[0.5625rem] tracking-widest text-[var(--accent-ink)]">
              {presetLabel}
            </span>
          </div>
          <dl className="space-y-1">
            {[
              ["IOR", material.ior.toFixed(2)],
              ["REFRACT", material.strength.toFixed(2)],
              ["CURVE", material.curvature.toFixed(2)],
              ["THICK", material.thickness.toFixed(2)],
              ["DISPERSION", material.chroma ? "ON" : "OFF"],
              ["MODE", scene.compare.toUpperCase()],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between">
                <dt className="text-[0.625rem] tracking-[0.12em] text-[var(--ink-3)]">{k}</dt>
                <dd className="mono text-[0.6875rem] text-[var(--ink)]">{v}</dd>
              </div>
            ))}
            <div className="mt-1.5 flex items-baseline justify-between border-t border-[var(--line-soft)] pt-1.5">
              <dt className="text-[0.625rem] tracking-[0.12em] text-[var(--ink-3)]">ENV</dt>
              <dd className="mono text-[0.6875rem] text-[var(--ink)]">{envDef.label.toUpperCase()}</dd>
            </div>
          </dl>
        </div>

        {/* presets */}
        <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center">
          <div className="lab-scroll flex max-w-full items-center gap-1.5 overflow-x-auto px-4">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="preset-pill"
                data-active={activePreset === p.id}
                onClick={() => onPreset(p.id)}
                title={p.blurb}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* -------- control panel slot -------- */}
      <div className="relative z-20 mx-auto max-w-[1440px] px-4 pb-8 pt-5 lg:pointer-events-none lg:absolute lg:inset-0 lg:px-8 lg:pb-0 lg:pt-0">
        <div className="mx-auto max-w-md lg:pointer-events-auto lg:absolute lg:right-8 lg:top-[74px] lg:mx-0 lg:w-[342px]">
          <div className="lab-scroll lg:max-h-[calc(100svh-130px)] lg:overflow-y-auto lg:pr-1">
            {panel}
          </div>
        </div>
      </div>
    </section>
  );
}
