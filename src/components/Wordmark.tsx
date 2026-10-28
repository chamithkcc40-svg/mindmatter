interface WordmarkProps {
  /** Rendered size of the mark in pixels. */
  size?: number;
  className?: string;
}

/**
 * The Mind Matter identity: an orbital glyph (a mind as a system of matter in
 * motion) paired with a tightly tracked wordmark.
 */
export function Wordmark({ size = 30, className = '' }: WordmarkProps) {
  return (
    <span className={`wordmark ${className}`.trim()}>
      <svg
        className="wordmark__glyph"
        width={size}
        height={size}
        viewBox="0 0 40 40"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="mm-glyph" x1="4" y1="4" x2="36" y2="36">
            <stop offset="0%" stopColor="#7fd8ff" />
            <stop offset="55%" stopColor="#5b8dff" />
            <stop offset="100%" stopColor="#a48bff" />
          </linearGradient>
        </defs>
        <circle
          cx="20"
          cy="20"
          r="16.5"
          fill="none"
          stroke="url(#mm-glyph)"
          strokeWidth="1.1"
          opacity="0.55"
        />
        <ellipse
          cx="20"
          cy="20"
          rx="16.5"
          ry="6.4"
          fill="none"
          stroke="url(#mm-glyph)"
          strokeWidth="1.1"
          transform="rotate(-32 20 20)"
        />
        <circle cx="20" cy="20" r="4.6" fill="url(#mm-glyph)" />
        <circle cx="33.2" cy="13.4" r="1.7" fill="#bff3ff" />
      </svg>
      <span className="wordmark__type">
        <span className="wordmark__mind">MIND</span>
        <span className="wordmark__matter">MATTER</span>
      </span>
    </span>
  );
}
