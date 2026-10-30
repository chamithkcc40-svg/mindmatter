/**
 * WebGL2 capability probe and the CSS fallback switch.
 *
 * When WebGL2 is missing (or a shader fails to build) the document gets the
 * `lg-fallback` class. Surfaces then render as polished, fully opaque crystal
 * panels from CSS — no blur filters, no translucent white glassmorphism.
 */

let supported: boolean | null = null;
let failureCount = 0;

export function webgl2Available(): boolean {
  if (supported !== null) return supported;
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    supported = Boolean(gl);
    // Release the probe context immediately so it never counts against the
    // browser's context budget.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    supported = false;
  }
  return supported;
}

/** Called by the bootstrap before the first paint to avoid a flash. */
export function primeFallback(): void {
  if (typeof document === 'undefined') return;
  if (!webgl2Available()) reportGlassFailure();
}

export function reportGlassFailure(): void {
  failureCount += 1;
  document.documentElement.classList.add('lg-fallback');
}

export function reportGlassReady(): void {
  failureCount = Math.max(0, failureCount - 1);
  if (failureCount === 0) document.documentElement.classList.remove('lg-fallback');
}
