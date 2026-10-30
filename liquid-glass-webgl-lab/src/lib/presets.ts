/** Material parameters, presets, and environment definitions. */

export type EnvId = "studio" | "geometric" | "abstract" | "light";
export type CompareMode = "on" | "off" | "split";
export type Quality = "high" | "balanced" | "eco";

export interface MaterialParams {
  /** refractive index 1.0 – 2.2 */
  ior: number;
  /** refraction strength 0 – 1.6 */
  strength: number;
  /** dome curvature 0.15 – 1.5 */
  curvature: number;
  /** apparent thickness 0.1 – 2 */
  thickness: number;
  /** reflection intensity 0 – 1.3 */
  reflect: number;
  /** edge highlight intensity 0 – 2 */
  edge: number;
  /** chromatic aberration on/off */
  chroma: boolean;
  /** rough transmission (frost) 0 – 1 */
  frost: number;
  /** absorption coefficient 0 – 2.2 */
  absorb: number;
  /** unit-path transmittance colour */
  tint: [number, number, number];
  /** Fresnel base reflectance */
  f0: number;
}

export interface SceneSettings {
  env: EnvId;
  animate: boolean;
  autoRotate: boolean;
  compare: CompareMode;
  quality: Quality;
}

export const DEFAULT_MATERIAL: MaterialParams = {
  ior: 1.45,
  strength: 0.9,
  curvature: 0.9,
  thickness: 1.0,
  reflect: 0.75,
  edge: 1.0,
  chroma: true,
  frost: 0,
  absorb: 0.05,
  tint: [0.9, 0.95, 1.0],
  f0: 0.04,
};

export const DEFAULT_SCENE: SceneSettings = {
  env: "studio",
  animate: true,
  autoRotate: true,
  compare: "on",
  quality: "high",
};

export interface Preset {
  id: string;
  label: string;
  blurb: string;
  params: MaterialParams;
}

export const PRESETS: Preset[] = [
  {
    id: "crystal",
    label: "PURE CRYSTAL",
    blurb: "Near-perfect clarity, minimal dispersion, restrained edges.",
    params: {
      ior: 1.52,
      strength: 0.55,
      curvature: 0.7,
      thickness: 0.8,
      reflect: 0.6,
      edge: 0.7,
      chroma: false,
      frost: 0,
      absorb: 0.06,
      tint: [0.94, 0.97, 1.0],
      f0: 0.035,
    },
  },
  {
    id: "liquid",
    label: "LIQUID GLASS",
    blurb: "Full curvature, visible refraction, polished highlights.",
    params: {
      ior: 1.45,
      strength: 0.95,
      curvature: 1.0,
      thickness: 1.1,
      reflect: 0.8,
      edge: 1.15,
      chroma: true,
      frost: 0,
      absorb: 0.05,
      tint: [0.9, 0.95, 1.0],
      f0: 0.04,
    },
  },
  {
    id: "lens",
    label: "OPTICAL LENS",
    blurb: "High-index magnifier with strong lens distortion.",
    params: {
      ior: 1.9,
      strength: 1.35,
      curvature: 1.2,
      thickness: 0.9,
      reflect: 0.55,
      edge: 0.9,
      chroma: true,
      frost: 0,
      absorb: 0.05,
      tint: [0.92, 0.96, 1.0],
      f0: 0.05,
    },
  },
  {
    id: "frosted",
    label: "FROSTED GLASS",
    blurb: "Rough transmission — Poisson-disc microfacet approximation.",
    params: {
      ior: 1.5,
      strength: 0.6,
      curvature: 0.55,
      thickness: 1.2,
      reflect: 0.5,
      edge: 1.0,
      chroma: false,
      frost: 1.0,
      absorb: 0.22,
      tint: [0.9, 0.95, 1.0],
      f0: 0.06,
    },
  },
  {
    id: "smoked",
    label: "SMOKED GLASS",
    blurb: "Warm-grey absorption via Beer–Lambert attenuation.",
    params: {
      ior: 1.5,
      strength: 0.8,
      curvature: 0.8,
      thickness: 1.4,
      reflect: 0.85,
      edge: 1.3,
      chroma: false,
      frost: 0,
      absorb: 1.35,
      tint: [0.58, 0.62, 0.68],
      f0: 0.05,
    },
  },
];

export interface EnvDef {
  id: EnvId;
  label: string;
  short: string;
  isLight: boolean;
  reflLo: [number, number, number];
  reflHi: [number, number, number];
  reflStrip: [number, number, number];
}

export const ENVS: EnvDef[] = [
  {
    id: "studio",
    label: "Studio Dark",
    short: "DARK",
    isLight: false,
    reflLo: [0.015, 0.017, 0.028],
    reflHi: [0.10, 0.13, 0.21],
    reflStrip: [0.55, 0.68, 0.95],
  },
  {
    id: "geometric",
    label: "Geometric",
    short: "GRID",
    isLight: false,
    reflLo: [0.012, 0.013, 0.018],
    reflHi: [0.08, 0.09, 0.12],
    reflStrip: [0.85, 0.9, 1.0],
  },
  {
    id: "abstract",
    label: "Colour Field",
    short: "HUE",
    isLight: false,
    reflLo: [0.05, 0.04, 0.11],
    reflHi: [0.16, 0.1, 0.26],
    reflStrip: [0.75, 0.6, 1.0],
  },
  {
    id: "light",
    label: "Light Studio",
    short: "LIGHT",
    isLight: true,
    reflLo: [0.5, 0.53, 0.58],
    reflHi: [0.97, 0.98, 1.0],
    reflStrip: [1.0, 1.0, 1.0],
  },
];

export const QUALITY_DPR: Record<Quality, number> = {
  high: 2,
  balanced: 1.5,
  eco: 1,
};
