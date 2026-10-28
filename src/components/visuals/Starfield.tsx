import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface StarfieldProps {
  /** Stars per 10,000 CSS px² of canvas. */
  density?: number;
  /** Hard cap so large screens stay cheap on integrated GPUs. */
  maxStars?: number;
  /** Subtle parallax that follows the pointer. */
  parallax?: boolean;
  className?: string;
}

interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
  phase: number;
  drift: number;
  tint: string;
  glow: boolean;
}

const TINTS = ['#ffffff', '#dfe9ff', '#bfd8ff', '#9fd9ff', '#d9cdff'];

/** Cheap deterministic PRNG so the field is stable across resizes. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildStars(count: number, seed: number): Star[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const glow = rand() > 0.93;
    return {
      x: rand(),
      y: rand(),
      r: glow ? 1.1 + rand() * 1.2 : 0.25 + rand() * 0.85,
      alpha: 0.25 + rand() * 0.65,
      phase: rand() * Math.PI * 2,
      drift: 0.35 + rand() * 0.9,
      tint: TINTS[Math.floor(rand() * TINTS.length)] ?? '#ffffff',
      glow,
    };
  });
}

/**
 * Animated deep-space starfield. Renders only while on screen and the tab is
 * visible; collapses to a single static frame when reduced motion is requested.
 */
export function Starfield({
  density = 0.9,
  maxStars = 220,
  parallax = true,
  className,
}: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars: Star[] = [];
    let frame = 0;
    let running = false;
    let visible = true;
    let pageVisible = !document.hidden;
    let start = performance.now();
    let paused = reducedMotion;

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const render = (time: number) => {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);
      const elapsed = (time - start) / 1000;

      pointer.x += (pointer.tx - pointer.x) * 0.045;
      pointer.y += (pointer.ty - pointer.y) * 0.045;

      for (const star of stars) {
        const px = star.x * width + (parallax ? pointer.x * star.drift * 14 * (star.r + 0.4) : 0);
        const py = star.y * height + (parallax ? pointer.y * star.drift * 14 * (star.r + 0.4) : 0);
        const twinkle = paused
          ? 0.85
          : 0.62 + 0.38 * Math.sin(elapsed * star.drift * 1.15 + star.phase);
        const alpha = Math.min(1, star.alpha * twinkle);

        ctx.globalAlpha = alpha;
        if (star.glow && !paused) {
          const radius = star.r * 5;
          const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
          gradient.addColorStop(0, star.tint);
          gradient.addColorStop(0.35, 'rgba(160, 200, 255, 0.18)');
          gradient.addColorStop(1, 'rgba(120, 170, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = star.tint;
        ctx.beginPath();
        ctx.arc(px, py, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (time: number) => {
      render(time);
      if (running) frame = requestAnimationFrame(loop);
    };

    const shouldRun = () => !paused && visible && pageVisible;

    const sync = () => {
      const run = shouldRun();
      if (run && !running) {
        running = true;
        start = performance.now();
        frame = requestAnimationFrame(loop);
      } else if (!run && running) {
        running = false;
        cancelAnimationFrame(frame);
      }
      if (!run) render(performance.now());
    };

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = width * height;
      const count = Math.max(
        40,
        Math.min(maxStars, Math.round((area / 10_000) * density)),
      );
      stars = buildStars(count, 20_260_428);
      render(performance.now());
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.tx = (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
      pointer.ty = (event.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
    };

    const onVisibility = () => {
      pageVisible = !document.hidden;
      sync();
    };

    setup();
    sync();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => setup())
        : null;
    resizeObserver?.observe(canvas);

    const intersectionObserver =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            ([entry]) => {
              visible = entry?.isIntersecting ?? true;
              sync();
            },
            { threshold: 0 },
          )
        : null;
    intersectionObserver?.observe(canvas);

    if (parallax) window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    // Reduced motion can change at runtime; re-evaluate when it does.
    let media: MediaQueryList | null = null;
    const onMotionPreference = (event: MediaQueryListEvent) => {
      paused = event.matches;
      sync();
    };
    if (window.matchMedia) {
      media = window.matchMedia('(prefers-reduced-motion: reduce)');
      paused = media.matches;
      media.addEventListener('change', onMotionPreference);
    }

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      media?.removeEventListener('change', onMotionPreference);
    };
  }, [density, maxStars, parallax, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
