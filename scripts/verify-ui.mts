/**
 * Mind Matter — DOM verification harness.
 *
 * Renders the real React app in jsdom for every route and exercises the Solar
 * System Explorer controls, navigation, mobile menu and keyboard shortcuts.
 * This is not a browser: layout and painting are not evaluated (canvas gets a
 * stub context). Run with `npm run verify:ui`.
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM(
  '<!doctype html><html><body><div id="root"></div></body></html>',
  { url: 'http://localhost:5173/', pretendToBeVisual: true },
);

const win = dom.window as unknown as Window & typeof globalThis;
const g = globalThis as unknown as Record<string, unknown>;

g.window = win;
g.document = win.document;
g.HTMLElement = win.HTMLElement;
g.Element = win.Element;
g.Node = win.Node;
g.Event = win.Event;
g.CustomEvent = win.CustomEvent;
g.KeyboardEvent = win.KeyboardEvent;
g.PointerEvent = win.MouseEvent;
g.MutationObserver = win.MutationObserver;
g.getComputedStyle = win.getComputedStyle.bind(win);
g.requestAnimationFrame = (cb: FrameRequestCallback) =>
  setTimeout(() => cb(performance.now()), 16) as unknown as number;
g.cancelAnimationFrame = (id: number) => clearTimeout(id);
Object.defineProperty(g, 'navigator', { value: win.navigator, configurable: true });

win.matchMedia = ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent: () => false,
})) as typeof win.matchMedia;

class IntersectionObserverStub {
  constructor(private callback: (entries: Array<{ isIntersecting: boolean; target: Element }>) => void) {}
  observe(target: Element) {
    this.callback([{ isIntersecting: true, target }]);
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
g.IntersectionObserver = IntersectionObserverStub;
(win as unknown as Record<string, unknown>).IntersectionObserver = IntersectionObserverStub;

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
g.ResizeObserver = ResizeObserverStub;
(win as unknown as Record<string, unknown>).ResizeObserver = ResizeObserverStub;

const gradient = { addColorStop() {} };
const ctxStub: Record<string, unknown> = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === 'canvas') return {};
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') {
        return () => gradient;
      }
      if (prop === 'measureText') return (text: string) => ({ width: text.length * 6 });
      return () => undefined;
    },
    set() {
      return true;
    },
  },
);

win.HTMLCanvasElement.prototype.getContext = (() => ctxStub) as never;
win.HTMLCanvasElement.prototype.getBoundingClientRect = (() => ({
  width: 900,
  height: 600,
  top: 0,
  left: 0,
  right: 900,
  bottom: 600,
  x: 0,
  y: 0,
  toJSON() {},
})) as never;
win.scrollTo = () => {};
win.HTMLElement.prototype.scrollIntoView = () => {};

const { createRoot } = await import('react-dom/client');
type Root = ReturnType<typeof createRoot>;
const { createElement, StrictMode } = await import('react');
const { MemoryRouter } = await import('react-router-dom');
const { App } = await import('../src/App');

const consoleErrors: string[] = [];
const originalError = console.error;
console.error = (...args: unknown[]) => {
  consoleErrors.push(args.map(String).join(' '));
};

let failures = 0;
let checks = 0;

function check(label: string, condition: boolean, detail = '') {
  checks += 1;
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const rootEl = win.document.getElementById('root')!;
const root: Root = createRoot(rootEl);
let currentPath = '';
let renderCount = 0;
let currentRouter: ReturnType<typeof createElement> | null = null;

async function renderRoute(path: string, options: { reducedMotion?: boolean } = {}) {
  currentPath = path;
  win.matchMedia = ((query: string) => ({
    matches: options.reducedMotion ? query.includes('prefers-reduced-motion') : false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as typeof win.matchMedia;

  currentRouter = createElement(
    MemoryRouter,
    // A fresh key forces a new router instance, so `initialEntries` applies.
    { initialEntries: [path], key: `${path}:${renderCount++}` },
    createElement(App),
  );
  root.render(createElement(StrictMode, null, currentRouter));
  await tick(400);
}

async function tick(ms = 60) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

const $ = (selector: string) => rootEl.querySelector<HTMLElement>(selector);
const $$ = (selector: string) => Array.from(rootEl.querySelectorAll<HTMLElement>(selector));

function click(element: Element | null) {
  if (!element) throw new Error('click target missing');
  element.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }));
}

function key(init: KeyboardEventInit) {
  // Dispatch from the focused element so the event bubbles through document to
  // window exactly as a real key press does.
  const event = new win.KeyboardEvent('keydown', { bubbles: true, ...init });
  const target = (win.document.activeElement as HTMLElement | null) ?? win.document.body;
  target.dispatchEvent(event);
}

/** Sets a React-controlled input value the way a real keystroke would. */
function setInputValue(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(
    win.HTMLInputElement.prototype,
    'value',
  );
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
}

const KNOWN_ROUTES = new Set([
  '/',
  '/explore',
  '/explore/solar-system',
  '/science-library',
  '/about',
]);

function internalLinks() {
  return $$('a[href^="/"]').map((a) => a.getAttribute('href') ?? '');
}

console.log('\nHome page');
await renderRoute('/');
check('hero headline present', rootEl.textContent?.includes('Explore the Universe.') ?? false);
check(
  'secondary CTA links to the experiences section',
  Boolean($('a[href="#experiences"]')),
);
check('hero primary CTA opens the explorer', Boolean($('a[href="/explore/solar-system"]')));
check('seven experience cards rendered', $$('.feature-card').length === 7, String($$('.feature-card').length));
check('exactly one live module', $$('a.feature-card').length === 1, String($$('a.feature-card').length));
check('six coming-soon modules labelled', $$('.feature-card--soon').length === 6);
check('featured solar system card links to the explorer', Boolean($('a.featured-card[href="/explore/solar-system"]')));
check('navigation exposes four primary links', $$('.site-nav__link').length === 4);
check(
  'all internal links resolve to known routes',
  internalLinks().every((href) => KNOWN_ROUTES.has(href.split('#')[0] ?? '')),
  internalLinks().join(' '),
);
check('no placeholder "#" links', $$('a[href="#"]').length === 0);
check('page has a single h1', $$('h1').length === 1);

console.log('\nMobile navigation');
click($('.site-header__toggle'));
await tick();
check('toggle reports expanded', $('.site-header__toggle')?.getAttribute('aria-expanded') === 'true');
check('menu is rendered', Boolean($('#mobile-menu.is-open')));
check('body scroll locked', win.document.body.classList.contains('is-locked'));
key({ key: 'Escape' });
await tick();
check('Escape closes the menu', $('.site-header__toggle')?.getAttribute('aria-expanded') === 'false');

console.log('\nSolar System Explorer — overview');
await renderRoute('/explore/solar-system');
if (consoleErrors.length) {
  console.log('  EARLY CONSOLE ERRORS:');
  for (const e of consoleErrors.slice(0, 5)) console.log('   >', e.slice(0, 600));
}
check('h1 names the experience', $('h1')?.textContent?.includes('Live Solar System') ?? false);
check('simulation disclaimer is visible', rootEl.textContent?.includes('not live positions') ?? false);
check('canvas is exposed as an image with a label', Boolean($('canvas[role="img"]')?.getAttribute('aria-label')));
check('overview explains the Sun', rootEl.textContent?.includes('99.86%') ?? false);
check('all eight planet chips exist', $$('.planet-chip').length === 9, String($$('.planet-chip').length));
check('pause control is reachable', Boolean($('.sim-btn--primary')));

console.log('\nSolar System Explorer — controls');
const pauseButton = $('.sim-btn--primary')!;
click(pauseButton);
await tick();
check('pause toggles to play', $('.sim-btn--primary')?.textContent?.trim().startsWith('Play') ?? false);
check('pause reports pressed state', $('.sim-btn--primary')?.getAttribute('aria-pressed') === 'true');
click($('.sim-btn--primary'));
await tick();
check('play returns to pause label', $('.sim-btn--primary')?.textContent?.trim().startsWith('Pause') ?? false);

const speed = $<HTMLInputElement>('#sim-speed');
check('speed slider is a range input', speed?.type === 'range');
if (speed) {
  setInputValue(speed, '2.5');
  await tick();
  check('speed value reflects the slider', rootEl.textContent?.includes('2.5×') ?? false);
}

const zoomInButton = $$('.sim-btn--icon')[1];
click(zoomInButton);
await tick();
check('zoom in updates the readout', $('.sim-controls__zoom-value')?.textContent === '115%', $('.sim-controls__zoom-value')?.textContent ?? '');

console.log('\nPlanet selection');
const saturnChip = $$('.planet-chip').find((chip) => chip.textContent?.includes('Saturn'));
click(saturnChip ?? null);
await tick();
check('saturn chip is pressed', saturnChip?.getAttribute('aria-pressed') === 'true');
check('panel shows Saturn', $('.planet-panel__title')?.textContent === 'Saturn');
check('panel shows distance', rootEl.textContent?.includes('1.43 billion km') ?? false);
check('panel shows orbital period', rootEl.textContent?.includes('29.45 Earth years') ?? false);
check('panel shows moon count with date', rootEl.textContent?.includes('as of March 2025') ?? false);
check('panel shows scientific facts', $$('.fact-list li').length >= 2);
check('full-system control available', Boolean($('.planet-panel__close')));

key({ key: 'Escape' });
await tick();
check('Escape returns to the full system', $('.planet-panel__title')?.textContent === 'Our solar system');

const neptuneChip = $$('.planet-chip').find((chip) => chip.textContent?.includes('Neptune'));
click(neptuneChip ?? null);
await tick();
check('selecting another planet updates the panel', $('.planet-panel__title')?.textContent === 'Neptune');
check('planet type is shown', rootEl.textContent?.includes('Ice giant') ?? false);
click($('.planet-panel__close'));
await tick();
check('close button clears the selection', $('.planet-panel__title')?.textContent === 'Our solar system');

console.log('\nKeyboard shortcuts');
click($$('.sim-btn').find((button) => button.textContent?.includes('Reset view')) ?? null);
await tick();
check('reset view returns to 100%', $('.sim-controls__zoom-value')?.textContent === '100%');
const beforeSpace = $('.sim-btn--primary')?.textContent?.trim();
key({ code: 'Space' });
await tick();
check('space toggles playback', $('.sim-btn--primary')?.textContent?.trim() !== beforeSpace);
key({ code: 'Space' });
await tick();
key({ key: '+' });
await tick();
check('plus zooms in', $('.sim-controls__zoom-value')?.textContent === '115%', $('.sim-controls__zoom-value')?.textContent ?? '');
key({ key: 'r' });
await tick();
check('r resets the view', $('.sim-controls__zoom-value')?.textContent === '100%');

console.log('\nReduced motion');
await renderRoute('/explore/solar-system', { reducedMotion: true });
await tick(120);
check('simulation starts paused', $('.sim-btn--primary')?.textContent?.trim().startsWith('Play') ?? false);

console.log('\nOther routes');
for (const route of ['/explore', '/science-library', '/about', '/nope']) {
  await renderRoute(route);
  check(`${route} renders a heading`, Boolean($('h1')));
  check(
    `${route} has resolvable internal links`,
    internalLinks().every((href) => KNOWN_ROUTES.has(href.split('#')[0] ?? '')),
    internalLinks().join(' '),
  );
}

console.log('\nData integrity');
const { PLANETS } = await import('../src/data/planets');
check('eight planets with unique ids', new Set(PLANETS.map((p) => p.id)).size === 8);
check('planet order runs 1–8', PLANETS.every((p, i) => p.order === i + 1));
check('no planet has placeholder copy', !PLANETS.some((p) => /lorem|ipsum|todo|tbd/i.test(p.tagline + p.facts.join(' '))));
check(
  'no unsupported live-data claims in UI copy',
  !/real[- ]time telemetry|live astronomy feed is connected/i.test(rootEl.textContent ?? ''),
);

console.log('\nStrictMode console errors:', consoleErrors.length);
for (const error of consoleErrors.slice(0, 10)) console.log('  -', error.slice(0, 240));
check('no React console errors', consoleErrors.length === 0);

console.log(`\n${checks - failures}/${checks} checks passed`);
process.exit(failures === 0 ? 0 : 1);
