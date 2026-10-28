# Mind Matter

An immersive science studio for the web. **Explore the Universe. Understand Everything.**

Mind Matter presents science as something you operate rather than read: the first
fully interactive experience is a **Live Solar System Explorer** — a real-time
canvas simulation of eight planets, with pause, speed, zoom, planet selection and
a sourced data panel for each world.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script             | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `npm run dev`      | Vite dev server (0.0.0.0, for preview environments)  |
| `npm run build`    | Type-check (`tsc --noEmit`) then production build     |
| `npm run preview`  | Serve the production build locally                   |
| `npm run typecheck`| TypeScript only, strict mode                         |
| `npm run verify:ui`| DOM checks in jsdom over every route (see below)     |

The site is a client-rendered SPA (React Router). A static host needs a SPA
fallback to `index.html` for deep links such as `/explore/solar-system`.

---

## Routes

| Route                     | Page                                                     |
| ------------------------- | -------------------------------------------------------- |
| `/`                       | Homepage — hero, featured solar system, collection, principles |
| `/explore`                | Experience catalogue                                     |
| `/explore/solar-system`   | Solar System Explorer (fully interactive)                |
| `/science-library`        | Planetary data sheet + video library status              |
| `/about`                  | Studio story, principles, build methods                  |
| `*`                       | 404                                                      |

All navigation is real routing — no dead links, no inert buttons.

---

## Architecture

```
src/
  main.tsx                     entry (BrowserRouter)
  App.tsx                      layout, routes, scroll restoration
  styles/
    tokens.css                 colour, type, spacing, radius, motion tokens
    base.css                   reset, typography, buttons, shared primitives
    components.css             wordmark, header, footer, feature cards
    home.css                   hero, celestial composition, featured card
    explorer.css               stage, controls, planet panel
    pages.css                  interior pages
  data/
    planets.ts                 structured planetary dataset (single source)
    features.ts                experience registry (add a module here)
  features/
    home/                      Hero, FeaturedExperience, PrincipleBand
    solar-system/
      render.ts                pure canvas drawing + simulation maths
      SolarSystemCanvas.tsx    React wrapper: rAF loop, hit-testing, cleanup
      SimulationControls.tsx   playback, speed, zoom, planet rail
      PlanetPanel.tsx          data + science facts panel
  components/                  SiteHeader, SiteFooter, FeatureCard, Reveal,
                               Wordmark, icons, CursorLight, visuals/
  hooks/                       useReducedMotion, useInView, useLowPowerDevice,
                               useDocumentTitle
  pages/                       route components
scripts/verify-ui.mts          jsdom route + interaction checks
```

**Adding a science module:** register it in `src/data/features.ts`, add a route
in `src/App.tsx`, and drop the feature under `src/features/<id>/`. Cards, the
explore page and the footer read from that registry, so status (`live` /
`soon`) is declared once.

### Rendering strategy

The explorer uses **Canvas 2D**, not a 3D engine — no WebGL dependency, no heavy
payload, and it runs on integrated graphics. `render.ts` is pure (no React, no
DOM) so the same routine drives the browser, the homepage preview and offline
screenshots.

Performance behaviour:

- One `requestAnimationFrame` loop per canvas, cancelled on unmount.
- Rendering stops when the canvas scrolls out of view or the tab is hidden.
- While paused, frames are only redrawn when something actually changes.
- Device pixel ratio capped (2×, or 1.25× on low-power devices), particle counts
  and star density reduced when `hardwareConcurrency ≤ 4`, `deviceMemory ≤ 4` or
  the viewport is narrow.
- The homepage preview renders a single static frame; the animation lives in the
  explorer.

### Data honesty

- `src/data/planets.ts` is static reference data — NASA planetary fact sheets,
  moon counts from the IAU Minor Planet Center (current as of **March 2025**).
  Values are rounded and labelled as such.
- Planet positions are **generated locally** from real orbital periods; the
  simulation is **not** an ephemeris and does not show today's sky.
- Sizes and orbit radii are artistically compressed. This is stated on the
  homepage card, on the explorer stage, and in the information panel.
- "Live" in *Live Solar System* means continuously animated by default — not
  real-time telemetry. No API key, no external request, no invented timestamps.
- No live-data provider is wired up. When one exists, replace the local
  position generator behind the same `SolarSystemCanvas` props.

### Accessibility & motion

- Semantic landmarks, one `h1` per page, skip link, visible focus rings.
- Explorer controls are real `<button>` / `<input type="range">` elements with
  pressed states and labels; planets are also reachable from a text planet rail,
  so the canvas is not the only way to select a world.
- Keyboard: `Space` pause/resume, `+`/`-` zoom, `R` reset, `Escape` back to the
  full system. Shortcuts are ignored while a control has focus.
- Mobile menu traps focus, closes on `Escape`, and restores focus.
- `prefers-reduced-motion`: entrance animations collapse, the simulation starts
  paused, starfields render a single static frame, the cursor light is removed.
- Selections are announced through an `aria-live` status region.

---

## Verification

Executed in this environment (Node 22, no browser available — see limitations):

| Command             | Result |
| ------------------- | ------ |
| `npm run typecheck` | pass, 0 errors (strict, `noUnusedLocals`, `verbatimModuleSyntax`) |
| `npm run build`     | pass — ~325 kB JS / ~101 kB gzip, ~46 kB CSS / ~11 kB gzip |
| `npm run verify:ui` | **56/56 checks pass** across all routes |

`verify:ui` renders the real app in jsdom and asserts: hero copy and CTAs,
seven experience cards with exactly one live module, all internal links
resolving to known routes, mobile menu open/close with scroll lock, every
explorer control (pause, play, speed, zoom, reset), planet selection and panel
data for Saturn and Neptune, `Escape`/`Space`/`+`/`R` shortcuts, reduced-motion
startup, and the absence of React console errors.

### Known limitations

- **No real browser was available in this sandbox** (no Chrome/WebKit; apt and
  browser CDNs are blocked), so the checks above are DOM-level plus the canvas
  verified through offline PNG renders of `render.ts`. Pixel-level layout and
  cross-browser paint still need a pass in a real browser.
- No ESLint/Prettier config is included; correctness is enforced by TypeScript
  strict mode and the verification script.
- Moon counts age quickly (Saturn has gained irregular moons in recent years);
  the UI always shows the "as of" date so the number can be re-dated in one
  constant.
- The physics, chemistry, biology, maths, discoveries and video modules are
  honest "coming soon" cards — no simulated functionality behind them.

---

## Credits

Original branding, layout and implementation. Planet palette values and orbits
are Mind Matter's own artistic compression of NASA/IAU reference data.
