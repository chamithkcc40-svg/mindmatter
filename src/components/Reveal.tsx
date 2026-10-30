import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import type { GlassVariant } from '../liquid-glass';

interface RevealProps {
  children: ReactNode;
  /** Stagger in milliseconds. */
  delay?: number;
  as?: ElementType;
  className?: string;
  id?: string;
  /** Render this element as a liquid glass surface. */
  surface?: GlassVariant;
  /** Glass layer that owns the surface (defaults to the page backdrop). */
  surfaceLayer?: string;
}

/**
 * Scroll-triggered entrance. Adds `is-visible` once the element approaches the
 * viewport. CSS handles the transition and the reduced-motion fallback.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = '',
  id,
  surface,
  surfaceLayer,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      element.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      id={id}
      className={`reveal ${className}`.trim()}
      data-lg={surface}
      data-lg-layer={surfaceLayer}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
