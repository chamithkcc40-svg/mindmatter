/**
 * Original hero composition: a limb of a distant world lit from the upper left,
 * ringed by fine orbital arcs and drifting satellites. Built from layered CSS
 * gradients and one lightweight SVG so it degrades to a still image when
 * animation is unavailable.
 */
export function CelestialVisual() {
  return (
    <div className="celestial" aria-hidden="true">
      <div className="celestial__aura" />
      <div className="celestial__grid" />

      <svg
        className="celestial__orbits"
        viewBox="0 0 600 600"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="orbit-stroke" x1="80" y1="60" x2="540" y2="540">
            <stop offset="0%" stopColor="#6fb2ff" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#7f9dff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#b39bff" stopOpacity="0.4" />
          </linearGradient>
          <radialGradient id="sat-glow">
            <stop offset="0%" stopColor="#eaf5ff" />
            <stop offset="60%" stopColor="#8fc3ff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8fc3ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g className="celestial__ring-set">
          <ellipse
            cx="330"
            cy="330"
            rx="268"
            ry="112"
            stroke="url(#orbit-stroke)"
            strokeWidth="1"
            transform="rotate(-24 330 330)"
          />
          <ellipse
            cx="330"
            cy="330"
            rx="212"
            ry="86"
            stroke="rgba(150,190,255,0.16)"
            strokeWidth="1"
            strokeDasharray="2 7"
            transform="rotate(-24 330 330)"
          />
          <ellipse
            cx="330"
            cy="330"
            rx="320"
            ry="140"
            stroke="rgba(150,190,255,0.1)"
            strokeWidth="1"
            transform="rotate(18 330 330)"
          />
        </g>

        <g className="celestial__satellite celestial__satellite--a">
          <circle cx="560" cy="248" r="16" fill="url(#sat-glow)" opacity="0.5" />
          <circle cx="560" cy="248" r="3.4" fill="#dcecff" />
        </g>
        <g className="celestial__satellite celestial__satellite--b">
          <circle cx="146" cy="392" r="2.4" fill="#bcd8ff" opacity="0.8" />
        </g>
      </svg>

      <div className="celestial__world">
        <div className="celestial__atmosphere" />
        <div className="celestial__surface" />
        <div className="celestial__terminator" />
        <div className="celestial__limb" />
        <div className="celestial__city-glow" />
      </div>
    </div>
  );
}
