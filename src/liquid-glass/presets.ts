/**
 * Glass material presets for the Mind Matter liquid glass interface.
 *
 * Every value below feeds the GLASS_FS shader. The presets are named after the
 * role the surface plays in the UI so components only declare intent
 * (`data-lg="card"`), never shader numbers.
 */

export type GlassVariant =
  | 'panel'
  | 'card'
  | 'row'
  | 'bar'
  | 'pill'
  | 'chip'
  | 'button'
  | 'primary'
  | 'sheet'
  | 'plate';

export interface GlassPreset {
  /** Corner radius in CSS px, or 'pill' for a fully rounded capsule. */
  radius: number | 'pill';
  /** Bevel curvature multiplier — small controls read as more curved. */
  curvature: number;
  /** Apparent optical thickness (drives absorption + displacement). */
  thickness: number;
  /** Refraction strength of the field behind the glass. */
  refraction: number;
  /** Dispersion: RGB refractive-index split. */
  dispersion: number;
  /** Polished rim + caustic intensity. */
  rim: number;
  /** Emissive tint amount for lit (tinted) glass. 0 = clear crystal. */
  glow: number;
  /** Unit-path transmittance colour. */
  tint: [number, number, number];
  /** Surface opacity, 0..1. Backdrop panes are optical lenses (1.0). */
  alpha: number;
}

const CLEAR: [number, number, number] = [0.94, 0.97, 1.0];

export const GLASS_PRESETS: Record<GlassVariant, GlassPreset> = {
  /** Large information panes (planet panel, table shell, closing CTA). */
  panel: {
    radius: 26,
    curvature: 1.0,
    thickness: 1.15,
    refraction: 1.0,
    dispersion: 0.010,
    rim: 1.0,
    glow: 0,
    tint: [0.93, 0.96, 1.0],
    alpha: 1.0,
  },
  /** Experience cards and content panels. */
  card: {
    radius: 22,
    curvature: 0.95,
    thickness: 1.0,
    refraction: 0.95,
    dispersion: 0.009,
    rim: 0.95,
    glow: 0,
    tint: CLEAR,
    alpha: 1.0,
  },
  /** List rows (principles, approach cells). */
  row: {
    radius: 18,
    curvature: 0.85,
    thickness: 0.9,
    refraction: 0.9,
    dispersion: 0.008,
    rim: 0.85,
    glow: 0,
    tint: [0.95, 0.97, 1.0],
    alpha: 1.0,
  },
  /** Navigation dock and wide top bars. */
  bar: {
    radius: 'pill',
    curvature: 1.1,
    thickness: 0.95,
    refraction: 0.92,
    dispersion: 0.010,
    rim: 1.15,
    glow: 0,
    tint: [0.93, 0.96, 1.0],
    alpha: 0.94,
  },
  /** Floating pills and badges. */
  pill: {
    radius: 'pill',
    curvature: 1.25,
    thickness: 0.7,
    refraction: 0.75,
    dispersion: 0.008,
    rim: 1.0,
    glow: 0,
    tint: [0.95, 0.97, 1.0],
    alpha: 0.92,
  },
  /** Small labels, status chips, planet chips. */
  chip: {
    radius: 'pill',
    curvature: 1.15,
    thickness: 0.5,
    refraction: 0.55,
    dispersion: 0.005,
    rim: 0.8,
    glow: 0,
    tint: [0.95, 0.98, 1.0],
    alpha: 0.86,
  },
  /** Secondary buttons and icon buttons. */
  button: {
    radius: 'pill',
    curvature: 1.35,
    thickness: 0.6,
    refraction: 0.62,
    dispersion: 0.006,
    rim: 0.95,
    glow: 0,
    tint: [0.94, 0.97, 1.0],
    alpha: 0.90,
  },
  /** Lit accent glass — the primary call to action. */
  primary: {
    radius: 'pill',
    curvature: 1.3,
    thickness: 0.65,
    refraction: 0.55,
    dispersion: 0.006,
    rim: 1.1,
    glow: 1.45,
    tint: [0.31, 0.55, 0.99],
    alpha: 0.97,
  },
  /**
   * Full-width sheets (mobile menu). A sheet floats over live content, so it
   * is the densest clear glass in the system: heavy thickness plus a cool
   * absorbing tint keeps the labels readable without frosting the backdrop.
   */
  sheet: {
    radius: 28,
    curvature: 1.0,
    thickness: 2.6,
    refraction: 1.0,
    dispersion: 0.010,
    rim: 1.0,
    glow: 0,
    tint: [0.34, 0.44, 0.68],
    alpha: 0.995,
  },
  /** Floating cards that sit over artwork (hero status plate). */
  plate: {
    radius: 20,
    curvature: 1.15,
    thickness: 1.25,
    refraction: 1.05,
    dispersion: 0.011,
    rim: 1.05,
    glow: 0,
    tint: [0.92, 0.96, 1.0],
    alpha: 1.0,
  },
};

export const FALLBACK_PRESET = GLASS_PRESETS.card;

export function isGlassVariant(value: string): value is GlassVariant {
  return Object.prototype.hasOwnProperty.call(GLASS_PRESETS, value);
}

/** Cap for the glass drawing-buffer pixel ratio, per quality tier. */
export const GLASS_DPR_CAP = {
  high: 1.75,
  low: 1,
} as const;

/** Total pixel budget for one glass layer buffer (≈3.5 MP). */
export const GLASS_PIXEL_BUDGET = 3_500_000;

/** Key / fill light colours shared by every surface. */
export const KEY_LIGHT: [number, number, number] = [0.82, 0.9, 1.0];
export const FILL_LIGHT: [number, number, number] = [0.4, 0.6, 1.0];

/** Parse `#rrggbb` / `#rgb` into linear-ish 0..1 components. */
export function parseTint(value: string | undefined): [number, number, number] | null {
  if (!value) return null;
  const hex = value.trim().replace(/^#/, '');
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(hex)) return null;
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  const r = Number.parseInt(full.slice(0, 2), 16) / 255;
  const g = Number.parseInt(full.slice(2, 4), 16) / 255;
  const b = Number.parseInt(full.slice(4, 6), 16) / 255;
  return [r, g, b];
}
