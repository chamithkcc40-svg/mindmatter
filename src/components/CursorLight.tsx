import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * A barely-there light that follows the pointer on precise-pointer devices.
 * Purely decorative: disabled for touch, reduced motion, and short viewports.
 */
export function CursorLight() {
  const ref = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element || reducedMotion) return;

    const finePointer = window.matchMedia?.('(pointer: fine)').matches ?? false;
    if (!finePointer) return;

    let frame = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.35;
    let targetX = x;
    let targetY = y;
    let idle = true;

    const tick = () => {
      x += (targetX - x) * 0.12;
      y += (targetY - y) * 0.12;
      element.style.transform = `translate3d(${x - 320}px, ${y - 320}px, 0)`;
      if (Math.abs(targetX - x) > 0.6 || Math.abs(targetY - y) > 0.6) {
        frame = requestAnimationFrame(tick);
      } else {
        idle = true;
      }
    };

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      element.classList.add('is-active');
      if (idle) {
        idle = false;
        frame = requestAnimationFrame(tick);
      }
    };

    const onLeave = () => element.classList.remove('is-active');

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return <div ref={ref} className="cursor-light" aria-hidden="true" />;
}
