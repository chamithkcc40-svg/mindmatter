/**
 * Shared frame loop for every glass renderer plus the smoothed pointer state.
 * One requestAnimationFrame drives all layers; it stops when the tab is hidden
 * and can be throttled on low-power devices.
 */

type TickFn = (now: number) => void;

const listeners = new Set<TickFn>();
let raf = 0;
let running = false;
let lastFrame = 0;
let frameBudget = 1000 / 60;

function loop(now: number): void {
  if (!running) return;
  raf = requestAnimationFrame(loop);
  if (now - lastFrame < frameBudget) return;
  lastFrame = now;
  for (const listener of listeners) {
    try {
      listener(now);
    } catch {
      /* one bad frame must not stop the loop */
    }
  }
}

function start(): void {
  if (running || listeners.size === 0) return;
  if (typeof document !== 'undefined' && document.hidden) return;
  running = true;
  lastFrame = 0;
  raf = requestAnimationFrame(loop);
}

function stop(): void {
  running = false;
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

function onVisibility(): void {
  if (document.hidden) stop();
  else start();
}

export function subscribeTicker(listener: TickFn): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
  }
  start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    }
  };
}

/** Lower the target frame rate (used by the reduced render path). */
export function setFrameRate(fps: number): void {
  frameBudget = 1000 / Math.max(15, Math.min(120, fps));
}

/* ------------------------------------------------------------------ pointer */

let pointerTargetX = 0;
let pointerTargetY = 0;
let pointerX = 0;
let pointerY = 0;
let pointerLastAdvance = -1;
let pointerListening = false;

function onPointerMove(event: PointerEvent): void {
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  pointerTargetX = Math.max(-1, Math.min(1, (event.clientX / w) * 2 - 1));
  pointerTargetY = Math.max(-1, Math.min(1, -((event.clientY / h) * 2 - 1)));
}

/** Smoothed pointer, advanced at most once per frame. */
export function pointerState(now: number, reducedMotion: boolean): [number, number] {
  if (!pointerListening && typeof window !== 'undefined') {
    pointerListening = true;
    window.addEventListener('pointermove', onPointerMove, { passive: true });
  }
  if (now !== pointerLastAdvance) {
    pointerLastAdvance = now;
    const rate = reducedMotion ? 1 : 0.09;
    pointerX += (pointerTargetX - pointerX) * rate;
    pointerY += (pointerTargetY - pointerY) * rate;
  }
  return [pointerX, pointerY];
}
