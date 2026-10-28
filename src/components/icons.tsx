import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  focusable: false,
};

export function ArrowRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function ArrowLeft(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

export function ArrowDown(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4v15" />
      <path d="m6 13 6 6 6-6" />
    </svg>
  );
}

export function Orbit(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="10" ry="4.6" transform="rotate(-28 12 12)" />
      <circle cx="19.2" cy="7.6" r="1.4" />
    </svg>
  );
}

export function Atom(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="1.6" />
      <ellipse cx="12" cy="12" rx="9.2" ry="4" />
      <ellipse cx="12" cy="12" rx="9.2" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9.2" ry="4" transform="rotate(-60 12 12)" />
    </svg>
  );
}

export function Flask(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 3h5" />
      <path d="M10 3v5.6L5.4 17a2 2 0 0 0 1.8 3h9.6a2 2 0 0 0 1.8-3L14 8.6V3" />
      <path d="M7.3 14h9.4" />
    </svg>
  );
}

export function Dna(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3c0 6 10 6 10 12M17 3c0 6-10 6-10 12" />
      <path d="M7 21c0-2 .6-3.6 1.7-5M17 21c0-2-.6-3.6-1.7-5" />
      <path d="M8.4 7h7.2M8.4 12h7.2" />
    </svg>
  );
}

export function Sigma(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M17 5H7l6 7-6 7h10" />
    </svg>
  );
}

export function Spark(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v4.2M12 16.8V21M3 12h4.2M16.8 12H21" />
      <path d="M6 6l2.6 2.6M15.4 15.4 18 18M18 6l-2.6 2.6M8.6 15.4 6 18" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

export function Play(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 5.5v13l10-6.5-10-6.5Z" />
    </svg>
  );
}

export function Pause(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 5v14M15 5v14" />
    </svg>
  );
}

export function Plus(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function Minus(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function Reset(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3" />
      <path d="M3.5 4.5V11H10" />
    </svg>
  );
}

export function Close(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function Menu(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function Info(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.8v.2" />
    </svg>
  );
}

export const FEATURE_ICONS = {
  orbit: Orbit,
  atom: Atom,
  flask: Flask,
  dna: Dna,
  sigma: Sigma,
  spark: Spark,
  play: Play,
} as const;
