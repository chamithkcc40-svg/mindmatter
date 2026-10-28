# AGENTS.md — Mind Matter conventions

Guidance for automated agents and contributors working in this repository.

## Stack

- React 19 + TypeScript (strict) + Vite 8, React Router 7.
- Styling: plain CSS with design tokens in `src/styles/tokens.css`. No CSS
  framework, no CSS-in-JS. Add new tokens rather than hardcoding values.
- No 3D engine. Visualisation is Canvas 2D (`src/features/solar-system/render.ts`).

## Rules

1. **Never fabricate science or telemetry.** Simulations are labelled
   simulations; static data names its source and the date it was current. No
   invented timestamps, live indicators, or API responses.
2. **No fake functionality.** Modules that are not built are registered with
   `status: 'soon'` in `src/data/features.ts` and render as coming-soon cards.
3. **Keep `render.ts` pure.** Simulation maths and drawing live there and must
   not import React or touch the DOM. React wrappers own lifecycle, hit-testing
   and cleanup.
4. **Animation hygiene.** One rAF loop per canvas, cancelled on unmount; stop
   when the canvas is off-screen or the tab is hidden; redraw on demand when
   paused. Respect `prefers-reduced-motion` (see `useReducedMotion`).
5. **Accessibility.** Semantic HTML, one `h1` per route, real buttons and inputs,
   `aria-pressed` on toggles, keyboard access to everything a pointer can do, and
   visible focus states.
6. **Data lives in `src/data/*`.** Components must not hardcode planetary facts.

## Commands

```bash
npm run dev         # local dev server
npm run typecheck   # tsc --noEmit
npm run build       # typecheck + production build
npm run verify:ui   # jsdom route/interaction checks (must stay green)
```

Changes should leave `typecheck`, `build` and `verify:ui` passing. If you add a
route, extend `KNOWN_ROUTES` in `scripts/verify-ui.mts` and add a check.
