import { useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import ControlPanel from "./components/ControlPanel";
import ExperimentsSection from "./components/Experiments";
import MethodSection from "./components/MethodSection";
import Footer from "./components/Footer";
import { webgl2Available, type GlassEngine } from "./webgl/engine";
import {
  DEFAULT_MATERIAL,
  DEFAULT_SCENE,
  ENVS,
  PRESETS,
  type MaterialParams,
  type SceneSettings,
} from "./lib/presets";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <svg width="56" height="56" viewBox="0 0 32 32" className="mx-auto mb-6" aria-hidden="true">
          <defs>
            <radialGradient id="fb" cx="35%" cy="28%" r="85%">
              <stop offset="0%" stopColor="#bcd7ff" />
              <stop offset="55%" stopColor="#4a7dd6" />
              <stop offset="100%" stopColor="#0a1a3a" />
            </radialGradient>
          </defs>
          <circle cx="16" cy="16" r="14" fill="url(#fb)" />
        </svg>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)]">LIQUID GLASS LAB</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">
          This is a real-time optical material study rendered with WebGL2 and custom GLSL shaders.
          Your browser does not expose WebGL2, so the demonstration cannot run here.
        </p>
        <p className="mt-4 text-xs text-[var(--ink-3)]">
          Please use a current version of Chrome, Edge, Firefox or Safari with hardware
          acceleration enabled.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const glOk = useMemo(webgl2Available, []);
  const [material, setMaterial] = useState<MaterialParams>(() => ({ ...DEFAULT_MATERIAL }));
  const [scene, setScene] = useState<SceneSettings>(() => {
    const reduced = prefersReducedMotion();
    return { ...DEFAULT_SCENE, animate: !reduced, autoRotate: !reduced };
  });
  const [activePreset, setActivePreset] = useState<string | null>("liquid");
  const [, setHeroEngine] = useState<GlassEngine | null>(null);

  const light = ENVS.find((e) => e.id === scene.env)?.isLight ?? false;

  useEffect(() => {
    document.body.classList.toggle("light", light);
    return () => document.body.classList.remove("light");
  }, [light]);

  const patchMaterial = (p: Partial<MaterialParams>) => {
    setMaterial((m) => ({ ...m, ...p }));
    setActivePreset(null);
  };

  const patchScene = (p: Partial<SceneSettings>) => setScene((s) => ({ ...s, ...p }));

  const lastDarkRef = useRef<"studio" | "geometric" | "abstract">("studio");
  const toggleLight = () => {
    setScene((s) => {
      const def = ENVS.find((e) => e.id === s.env)!;
      if (def.isLight) return { ...s, env: lastDarkRef.current };
      lastDarkRef.current = s.env as "studio" | "geometric" | "abstract";
      return { ...s, env: "light" };
    });
  };

  const applyPreset = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setMaterial({ ...preset.params });
    setActivePreset(id);
  };

  const resetAll = () => {
    setMaterial({ ...DEFAULT_MATERIAL });
    setScene((s) => ({
      ...s,
      compare: DEFAULT_SCENE.compare,
      autoRotate: !prefersReducedMotion(),
      animate: !prefersReducedMotion(),
    }));
    setActivePreset("liquid");
  };

  if (!glOk) {
    return (
      <div className="min-h-screen">
        <Header light={false} onToggleLight={() => {}} onReset={() => {}} />
        <Fallback />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header light={light} onToggleLight={toggleLight} onReset={resetAll} />

      <HeroSection
        material={material}
        scene={scene}
        activePreset={activePreset}
        onPreset={applyPreset}
        onScene={patchScene}
        registerEngine={setHeroEngine}
        onGlError={() => {}}
        panel={
          <ControlPanel
            material={material}
            scene={scene}
            onMaterial={patchMaterial}
            onScene={patchScene}
            onReset={resetAll}
          />
        }
      />

      <ExperimentsSection />
      <MethodSection />
      <Footer />
    </div>
  );
}
