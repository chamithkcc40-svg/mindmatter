import { useEffect, useLayoutEffect, useRef } from 'react';
import type { PlanetId } from '../../data/planets';
import {
  cameraTargetFor,
  drawSolarSystem,
  type Camera,
  type ScreenBody,
} from './render';

export interface SolarSystemCanvasProps {
  selectedId?: PlanetId | null;
  onSelect?: (id: PlanetId | null) => void;
  /** When true the simulation clock stops (positions freeze). */
  paused?: boolean;
  /** Simulation rate multiplier. */
  speed?: number;
  /** User zoom, 1 = framed system. */
  zoom?: number;
  /** Pull the camera toward the selected planet. */
  focusSelected?: boolean;
  /** Respond to pointer hit-testing. */
  interactive?: boolean;
  showLabels?: boolean;
  showBelt?: boolean;
  /** Reduce particle counts and pixel ratio for low-power devices. */
  lowQuality?: boolean;
  label?: string;
  className?: string;
}

/**
 * Canvas-rendered orrery shared by the homepage feature card and the full
 * explorer. Orbital distances and body sizes are artistically compressed — the
 * page states this explicitly, and the simulation is not an ephemeris.
 */
export function SolarSystemCanvas({
  selectedId = null,
  onSelect,
  paused = false,
  speed = 1,
  zoom = 1,
  focusSelected = false,
  interactive = false,
  showLabels = true,
  showBelt = true,
  lowQuality = false,
  label = 'Animated solar system with eight planets orbiting the Sun',
  className = '',
}: SolarSystemCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    paused,
    speed,
    zoom,
    focusSelected,
    interactive,
    selectedId,
    showLabels,
    showBelt,
  });
  const onSelectRef = useRef(onSelect);
  const dirtyRef = useRef(true);

  useLayoutEffect(() => {
    dirtyRef.current = true;
    stateRef.current = {
      paused,
      speed,
      zoom,
      focusSelected,
      interactive,
      selectedId,
      showLabels,
      showBelt,
    };
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let running = false;
    let visible = true;
    let pageVisible = !document.hidden;
    let simTime = 0;
    let lastFrame = performance.now();
    let hoverId: PlanetId | null = null;
    let bodies: ScreenBody[] = [];

    const camera: Camera = { x: 0, y: 0, scale: 1 };

    const draw = () => {
      if (!width || !height) return;
      const state = stateRef.current;

      // Ease the camera toward the framing implied by the current selection.
      const target = cameraTargetFor({
        width,
        height,
        simTime,
        zoom: state.zoom,
        selectedId: state.selectedId,
        focusSelected: state.focusSelected,
      });
      camera.x += (target.x - camera.x) * 0.1;
      camera.y += (target.y - camera.y) * 0.1;
      camera.scale += (target.scale - camera.scale) * 0.1;

      const moving =
        Math.abs(target.x - camera.x) > 0.05 ||
        Math.abs(target.y - camera.y) > 0.05 ||
        Math.abs(target.scale - camera.scale) > 0.001;
      if (moving) dirtyRef.current = true;

      bodies = drawSolarSystem(ctx, {
        width,
        height,
        simTime,
        camera,
        selectedId: state.selectedId,
        hoverId,
        showLabels: state.showLabels,
        showBelt: state.showBelt,
        lowQuality,
        zoom: state.zoom,
      });
    };

    const loop = (time: number) => {
      const state = stateRef.current;
      const dt = Math.min(0.05, (time - lastFrame) / 1000);
      lastFrame = time;
      if (!state.paused) {
        simTime += dt * state.speed;
        dirtyRef.current = true;
      }
      if (dirtyRef.current || !state.paused) {
        draw();
        dirtyRef.current = false;
      }
      if (running) frame = requestAnimationFrame(loop);
    };

    const sync = () => {
      const shouldRun = visible && pageVisible;
      if (shouldRun && !running) {
        running = true;
        lastFrame = performance.now();
        dirtyRef.current = true;
        frame = requestAnimationFrame(loop);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(frame);
      }
      if (!shouldRun) {
        dirtyRef.current = true;
        draw();
      }
    };

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, lowQuality ? 1.25 : 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirtyRef.current = true;
      if (!running) draw();
    };

    const hitTest = (event: PointerEvent): PlanetId | null => {
      const rect = canvas.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      let best: PlanetId | null = null;
      let bestDistance = Infinity;
      for (const body of bodies) {
        const distance = Math.hypot(body.x - px, body.y - py);
        const threshold = Math.max(body.r + 10, 16);
        if (distance < threshold && distance < bestDistance) {
          best = body.id;
          bestDistance = distance;
        }
      }
      return best;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!stateRef.current.interactive || !onSelectRef.current) return;
      const id = hitTest(event);
      if (id) {
        event.preventDefault();
        onSelectRef.current(id);
      } else {
        onSelectRef.current(null);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!stateRef.current.interactive) return;
      const id = hitTest(event);
      if (id !== hoverId) {
        hoverId = id;
        dirtyRef.current = true;
        canvas.style.cursor = id ? 'pointer' : 'default';
      }
    };

    const onPointerLeave = () => {
      if (hoverId) {
        hoverId = null;
        dirtyRef.current = true;
        canvas.style.cursor = 'default';
      }
    };

    const onVisibility = () => {
      pageVisible = !document.hidden;
      sync();
    };

    setup();
    sync();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(setup) : null;
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

    if (interactive) {
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerleave', onPointerLeave);
    }
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [interactive, lowQuality]);

  return (
    <canvas
      ref={canvasRef}
      className={`solar-canvas ${className}`.trim()}
      role="img"
      aria-label={label}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
