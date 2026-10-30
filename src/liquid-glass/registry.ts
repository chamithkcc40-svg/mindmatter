/**
 * Surface registry.
 *
 * Any element carrying `data-lg="<variant>"` is a liquid glass surface. The
 * registry scans the document, resolves each element's material preset and
 * layer (`data-lg-layer`), and tracks hover / focus / press state so the
 * renderer can light the glass up without React re-rendering.
 *
 * Attributes
 *   data-lg          variant name (see presets.ts, default "card")
 *   data-lg-layer    renderer that owns the surface (default "base")
 *   data-lg-tint     override transmittance colour, "#rrggbb"
 *   data-lg-alpha    override surface opacity, 0..1
 *   data-lg-radius   override corner radius in CSS px
 *   data-lg-scale    multiply optical thickness (readability tuning)
 */

import {
  FALLBACK_PRESET,
  GLASS_PRESETS,
  isGlassVariant,
  parseTint,
  type GlassPreset,
  type GlassVariant,
} from './presets';

export interface GlassSurface {
  el: HTMLElement;
  layer: string;
  variant: GlassVariant;
  preset: GlassPreset;
  tint: [number, number, number];
  alpha: number;
  radius: number | 'pill';
  /** Disabled controls render dimmer glass and skip reflections. */
  disabled: boolean;
  /** Eased 0..1 emphasis (hover / focus). */
  emphasis: number;
  /** Target emphasis. */
  target: number;
}

const DEFAULT_LAYER = 'base';

let surfaces: GlassSurface[] = [];
let observer: MutationObserver | null = null;
let scanQueued = false;
let scanHandle = 0;
let listenerCount = 0;
let hovered: HTMLElement | null = null;
let focused: HTMLElement | null = null;
let reducedMotion = false;
let version = 0;
const versionListeners = new Set<() => void>();

function resolveNumber(value: string | undefined): number | null {
  if (value === undefined) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function buildSurface(el: HTMLElement): GlassSurface {
  const raw = el.dataset.lg ?? '';
  const variant: GlassVariant = isGlassVariant(raw) ? raw : 'card';
  const base = GLASS_PRESETS[variant] ?? FALLBACK_PRESET;
  const scale = resolveNumber(el.dataset.lgScale) ?? 1;
  const preset: GlassPreset =
    scale === 1 ? base : { ...base, thickness: base.thickness * scale };
  const tint = parseTint(el.dataset.lgTint) ?? preset.tint;
  const alpha = resolveNumber(el.dataset.lgAlpha) ?? preset.alpha;
  const radius = resolveNumber(el.dataset.lgRadius) ?? preset.radius;
  const disabled = el.matches(':disabled');
  const dimmed: GlassPreset = disabled
    ? {
        ...preset,
        thickness: preset.thickness * 0.7,
        glow: preset.glow * 0.25,
        rim: preset.rim * 0.6,
      }
    : preset;
  return {
    el,
    layer: el.dataset.lgLayer || DEFAULT_LAYER,
    variant,
    preset: dimmed,
    tint,
    alpha: Math.min(1, Math.max(0, disabled ? alpha * 0.45 : alpha)),
    radius,
    disabled,
    emphasis: 0,
    target: 0,
  };
}

function syncTargets(): void {
  for (const surface of surfaces) {
    const active = (surface.el === hovered || surface.el === focused) && !surface.disabled;
    surface.target = active ? 1 : 0;
  }
}

function scanNow(): void {
  if (typeof document === 'undefined') return;
  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-lg]'));
  surfaces = elements.map(buildSurface);
  syncTargets();
  version += 1;
  for (const listener of versionListeners) listener();
}

function queueScan(): void {
  if (scanQueued) return;
  scanQueued = true;
  if (typeof requestAnimationFrame === 'function') {
    scanHandle = requestAnimationFrame(() => {
      scanQueued = false;
      scanNow();
    });
  } else {
    scanQueued = false;
    scanNow();
  }
}

function closestSurface(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>('[data-lg]');
}

function onPointerOver(event: PointerEvent): void {
  const el = closestSurface(event.target);
  if (el === hovered) return;
  hovered = el;
  syncTargets();
}

function onPointerOut(event: PointerEvent): void {
  if (!hovered) return;
  const next = event.relatedTarget instanceof Node ? event.relatedTarget : null;
  if (next && hovered.contains(next)) return;
  hovered = null;
  syncTargets();
}

function onFocusIn(event: FocusEvent): void {
  focused = closestSurface(event.target);
  syncTargets();
}

function onFocusOut(): void {
  focused = null;
  syncTargets();
}

function attachGlobalListeners(): void {
  if (typeof window === 'undefined') return;
  document.addEventListener('pointerover', onPointerOver, { passive: true });
  document.addEventListener('pointerout', onPointerOut, { passive: true });
  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);
  window.addEventListener('resize', queueScan, { passive: true });
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        queueScan();
        return;
      }
      if (mutation.addedNodes.length || mutation.removedNodes.length) {
        queueScan();
        return;
      }
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      'data-lg',
      'data-lg-layer',
      'data-lg-tint',
      'data-lg-alpha',
      'data-lg-radius',
      'data-lg-scale',
      'disabled',
    ],
  });
}

/** Starts document scanning; safe to call from every layer mount. */
export function startSurfaceRegistry(): void {
  listenerCount += 1;
  if (listenerCount > 1) return;
  scanNow();
  attachGlobalListeners();
}

export function stopSurfaceRegistry(): void {
  listenerCount = Math.max(0, listenerCount - 1);
  if (listenerCount > 0) return;
  observer?.disconnect();
  observer = null;
  if (typeof window !== 'undefined') {
    document.removeEventListener('pointerover', onPointerOver);
    document.removeEventListener('pointerout', onPointerOut);
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('focusout', onFocusOut);
    window.removeEventListener('resize', queueScan);
  }
  if (scanHandle) cancelAnimationFrame(scanHandle);
  scanHandle = 0;
  scanQueued = false;
  surfaces = [];
  hovered = null;
  focused = null;
}

/** Surfaces owned by one renderer, in document order. */
export function surfacesForLayer(layer: string): GlassSurface[] {
  if (surfaces.length === 0) return surfaces;
  return surfaces.filter((surface) => surface.layer === layer);
}

export function surfaceVersion(): number {
  return version;
}

export function subscribeSurfaces(listener: () => void): () => void {
  versionListeners.add(listener);
  return () => versionListeners.delete(listener);
}

export function setReducedMotionPreference(reduced: boolean): void {
  reducedMotion = reduced;
}

/**
 * Eases emphasis. Guarded by frame timestamp so several renderers ticking in
 * the same frame advance the animation exactly once.
 */
let lastAdvance = -1;
export function advanceSurfaceEmphasis(now: number): void {
  if (now === lastAdvance) return;
  lastAdvance = now;
  const rate = reducedMotion ? 1 : 0.16;
  for (const surface of surfaces) {
    if (surface.emphasis === surface.target) continue;
    const next = surface.emphasis + (surface.target - surface.emphasis) * rate;
    surface.emphasis = Math.abs(next - surface.target) < 0.002 ? surface.target : next;
  }
}

/** True when any surface is mid-transition (keeps the loop awake briefly). */
export function surfacesAnimating(): boolean {
  return surfaces.some((surface) => surface.emphasis !== surface.target);
}
