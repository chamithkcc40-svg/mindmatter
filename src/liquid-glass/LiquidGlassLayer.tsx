import { useEffect, useRef } from 'react';
import { GlassRenderer } from './engine';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useLowPowerDevice } from '../hooks/useLowPowerDevice';
import { setFrameRate } from './ticker';
import { reportGlassFailure, webgl2Available } from './state';

export type GlassLayerMode = 'backdrop' | 'overlay' | 'region';

interface LiquidGlassLayerProps {
  /** Registry name matched by `data-lg-layer` on the surfaces it owns. */
  layer: string;
  /**
   * backdrop — fixed, renders the visible field and the in-flow glass
   * overlay  — fixed, transparent, auto-sized to its surfaces (nav chrome)
   * region   — fills its positioned parent, above that region's artwork
   */
  mode: GlassLayerMode;
  className?: string;
}

/**
 * Mounts one WebGL2 glass layer.
 *
 * A page uses at most three layers: the backdrop, the header chrome and one
 * region layer for glass that must sit above local artwork (the explorer
 * stage, the featured simulator). Every layer renders the same screen-space
 * field, so glass refracts a seamless continuation of what is behind it.
 */
export function LiquidGlassLayer({ layer, mode, className = '' }: LiquidGlassLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = useReducedMotion();
  const lowPower = useLowPowerDevice();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setFrameRate(lowPower ? 30 : 60);
    let renderer: GlassRenderer | null = null;
    try {
      renderer = new GlassRenderer({
        canvas,
        layer,
        bounds: mode === 'backdrop' ? 'viewport' : mode === 'region' ? 'host' : 'auto',
        quality: lowPower ? 'low' : 'high',
        reducedMotion,
      });
    } catch (error) {
      // No WebGL2 (or the GLSL failed): opaque crystal panels take over.
      reportGlassFailure();
      // Only surface a console warning when the GPU was expected to cope;
      // a browser without WebGL2 is the documented fallback path, not a bug.
      if (import.meta.env.DEV && webgl2Available()) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[liquid-glass] layer "${layer}" unavailable: ${message}`);
      }
    }

    return () => {
      renderer?.dispose();
    };
  }, [layer, mode, lowPower, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={`lg-layer lg-layer--${mode} lg-layer--${layer} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
