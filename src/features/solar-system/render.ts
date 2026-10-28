import { PLANETS, type Planet, type PlanetId } from '../../data/planets';
import { clamp } from '../../lib/format';

/**
 * Pure drawing layer for the solar system orrery.
 *
 * Keeping this separate from React means the exact same routine runs in the
 * browser and in offline render checks. All values are in CSS pixels.
 */

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

export interface ScreenBody {
  id: PlanetId;
  x: number;
  y: number;
  r: number;
}

export interface SolarFrame {
  width: number;
  height: number;
  /** Simulated seconds since the scene began. */
  simTime: number;
  camera: Camera;
  selectedId: PlanetId | null;
  hoverId: PlanetId | null;
  showLabels: boolean;
  showBelt: boolean;
  lowQuality: boolean;
  /** User zoom level, used to decide when labels appear. */
  zoom: number;
}

/** Earth completes one simulated revolution in this many seconds at 1×. */
const EARTH_ORBIT_SECONDS = 15;
/** Motion is compressed: w = w₀ · (Tₑ/T)^0.6 so Neptune still visibly moves. */
const PERIOD_EXPONENT = 0.6;

const ANGULAR_VELOCITY = new Map(
  PLANETS.map((planet) => [
    planet.id,
    ((Math.PI * 2) / EARTH_ORBIT_SECONDS) *
      Math.pow(365.256 / planet.orbitalPeriodDays, PERIOD_EXPONENT),
  ]),
);

const START_ANGLES = new Map(
  PLANETS.map((planet) => [planet.id, (planet.startAngleDeg * Math.PI) / 180]),
);

interface BeltRock {
  angle: number;
  radius: number;
  size: number;
  alpha: number;
}

function buildBelt(count: number): BeltRock[] {
  let seed = 991;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, () => ({
    angle: rand() * Math.PI * 2,
    radius: 0.462 + rand() * 0.096,
    size: 0.4 + rand() * 0.85,
    alpha: 0.12 + rand() * 0.32,
  }));
}

const BELT_FULL = buildBelt(150);
const BELT_LIGHT = buildBelt(70);

function getGeometry(width: number, height: number) {
  const unit = Math.min(width, height);
  return { unit, baseR: unit * 0.455 };
}

function orbitRadius(planet: Planet, baseR: number): number {
  return planet.visual.orbit * baseR;
}

function planetAngle(planet: Planet, simTime: number): number {
  return (
    (START_ANGLES.get(planet.id) ?? 0) +
    simTime * (ANGULAR_VELOCITY.get(planet.id) ?? 0)
  );
}

function planetWorldPosition(
  planet: Planet,
  baseR: number,
  simTime: number,
): { x: number; y: number; angle: number } {
  const angle = planetAngle(planet, simTime);
  const radius = orbitRadius(planet, baseR);
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, angle };
}

/** Where the camera should settle, given the current selection. */
export function cameraTargetFor(options: {
  width: number;
  height: number;
  simTime: number;
  zoom: number;
  selectedId: PlanetId | null;
  focusSelected: boolean;
}): Camera {
  const { baseR } = getGeometry(options.width, options.height);
  const baseScale = clamp(options.zoom, 0.55, 3.2);
  const selected = options.selectedId
    ? PLANETS.find((planet) => planet.id === options.selectedId)
    : undefined;

  if (options.focusSelected && selected) {
    const world = planetWorldPosition(selected, baseR, options.simTime);
    return {
      x: world.x,
      y: world.y,
      scale: Math.min(3.4, baseScale * 2.05),
    };
  }
  return { x: 0, y: 0, scale: baseScale };
}

function drawRing(
  ctx: CanvasRenderingContext2D,
  planet: Planet,
  x: number,
  y: number,
  r: number,
  alpha: number,
  half: 'back' | 'front',
) {
  const ring = planet.visual.ring;
  if (!ring || r < 2.5) return;
  const outer = r * ring.outer;
  const inner = r * ring.inner;
  if (outer - inner < 0.6) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ring.tilt);
  ctx.scale(1, 0.34);

  const a0 = half === 'front' ? 0 : Math.PI;
  const a1 = half === 'front' ? Math.PI : Math.PI * 2;

  // Annulus: outer arc forward, inner arc reversed (non-zero winding).
  ctx.beginPath();
  ctx.arc(0, 0, outer, a0, a1);
  ctx.arc(0, 0, inner, a1, a0, true);
  ctx.closePath();

  const sheen = ctx.createLinearGradient(-outer, 0, outer, 0);
  sheen.addColorStop(0, 'rgba(255,255,255,0.06)');
  sheen.addColorStop(0.42, ring.color);
  sheen.addColorStop(0.72, ring.color);
  sheen.addColorStop(1, 'rgba(255,255,255,0.08)');
  ctx.globalAlpha = alpha * 0.82;
  ctx.fillStyle = sheen;
  ctx.fill();

  // Fine edge lines give the ring band definition at small sizes.
  ctx.globalAlpha = alpha * 0.5;
  ctx.strokeStyle = 'rgba(255, 248, 232, 0.55)';
  ctx.lineWidth = Math.max(0.35, outer * 0.03);
  for (const radius of [outer, outer * 0.9, inner]) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, a0, a1);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  planet: Planet,
  x: number,
  y: number,
  r: number,
  sunX: number,
  sunY: number,
  alpha: number,
  highlighted: boolean,
) {
  const dx = sunX - x;
  const dy = sunY - y;
  const dist = Math.hypot(dx, dy) || 1;
  const lx = x + (dx / dist) * r * 0.42;
  const ly = y + (dy / dist) * r * 0.42;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Ambient glow hugging the body.
  const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.7);
  halo.addColorStop(0, planet.palette.glow);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.7, 0, Math.PI * 2);
  ctx.fill();

  if (planet.visual.ring && r > 2) {
    drawRing(ctx, planet, x, y, r, alpha, 'back');
  }

  // Body, lit from the Sun's direction.
  const body = ctx.createRadialGradient(lx, ly, r * 0.12, x, y, r * 1.08);
  body.addColorStop(0, planet.palette.light);
  body.addColorStop(0.55, planet.palette.base);
  body.addColorStop(1, planet.palette.dark);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Terminator shading.
  const shade = ctx.createRadialGradient(
    x - (dx / dist) * r * 0.7,
    y - (dy / dist) * r * 0.7,
    r * 0.25,
    x - (dx / dist) * r * 0.7,
    y - (dy / dist) * r * 0.7,
    r * 1.75,
  );
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(2,4,10,0.72)');
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  if (r > 3) {
    ctx.strokeStyle = 'rgba(214,232,255,0.34)';
    ctx.lineWidth = Math.max(0.5, r * 0.06);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.99, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (planet.visual.ring && r > 2) {
    drawRing(ctx, planet, x, y, r, alpha, 'front');
  }

  if (highlighted) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(140, 205, 255, 0.9)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(x, y, r + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

interface LabelBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function overlaps(a: LabelBox, b: LabelBox): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

/**
 * Chooses the first free position around a planet for its label. Labels are
 * skipped rather than stacked when a busy inner system leaves no room.
 */
function placeLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  r: number,
  fontSize: number,
  taken: LabelBox[],
  width: number,
  height: number,
): { x: number; y: number; baseline: CanvasTextBaseline; box: LabelBox } | null {
  ctx.font = `${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  const textWidth = ctx.measureText(text).width;
  const padX = 4;
  const h = fontSize + 4;

  const candidates: Array<{ dy: number; baseline: CanvasTextBaseline }> = [
    { dy: r + 6, baseline: 'top' },
    { dy: -(r + 6) - h, baseline: 'top' },
    { dy: -h / 2, baseline: 'top' },
  ];

  for (const candidate of candidates) {
    const top = y + candidate.dy;
    const box: LabelBox = {
      x0: x - textWidth / 2 - padX,
      x1: x + textWidth / 2 + padX,
      y0: top - 1,
      y1: top + h + 1,
    };
    if (box.y0 < 2 || box.y1 > height - 2 || box.x0 < 2 || box.x1 > width - 2) {
      continue;
    }
    if (taken.some((existing) => overlaps(box, existing))) continue;
    taken.push(box);
    return { x, y: top, baseline: candidate.baseline, box };
  }
  return null;
}

/**
 * Draws one frame and returns the on-screen positions of every planet so the
 * caller can hit-test pointer input against them.
 */
export function drawSolarSystem(
  ctx: CanvasRenderingContext2D,
  frame: SolarFrame,
): ScreenBody[] {
  const { width, height, simTime, camera, selectedId, hoverId } = frame;
  ctx.clearRect(0, 0, width, height);

  const { unit, baseR } = getGeometry(width, height);
  const cx = width / 2;
  const cy = height / 2;
  const sunScreenX = cx - camera.x * camera.scale;
  const sunScreenY = cy - camera.y * camera.scale;
  const sunRadius = clamp(unit * 0.031, 7.5, 26) * Math.pow(camera.scale, 0.5);

  // --- Sun glow -------------------------------------------------------
  const glowRadius = sunRadius * 6.2;
  const sunGlow = ctx.createRadialGradient(
    sunScreenX,
    sunScreenY,
    sunRadius * 0.3,
    sunScreenX,
    sunScreenY,
    glowRadius,
  );
  sunGlow.addColorStop(0, 'rgba(255, 214, 138, 0.55)');
  sunGlow.addColorStop(0.18, 'rgba(255, 176, 92, 0.24)');
  sunGlow.addColorStop(0.45, 'rgba(255, 140, 80, 0.08)');
  sunGlow.addColorStop(1, 'rgba(255, 120, 60, 0)');
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunScreenX, sunScreenY, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // --- Asteroid belt ---------------------------------------------------
  if (frame.showBelt) {
    const belt = frame.lowQuality ? BELT_LIGHT : BELT_FULL;
    ctx.save();
    ctx.translate(sunScreenX, sunScreenY);
    const beltSpin = simTime * 0.035;
    ctx.fillStyle = '#b8c6de';
    for (const rock of belt) {
      const a = rock.angle + beltSpin;
      const r = rock.radius * baseR * camera.scale;
      ctx.globalAlpha = rock.alpha * 0.85;
      ctx.fillRect(
        Math.cos(a) * r,
        Math.sin(a) * r,
        Math.max(0.6, rock.size * camera.scale * 0.7),
        Math.max(0.6, rock.size * camera.scale * 0.7),
      );
    }
    ctx.restore();
  }

  // --- Orbit paths ------------------------------------------------------
  for (const planet of PLANETS) {
    const radius = orbitRadius(planet, baseR) * camera.scale;
    const isSelected = selectedId === planet.id;
    ctx.beginPath();
    ctx.arc(sunScreenX, sunScreenY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = isSelected
      ? 'rgba(150, 205, 255, 0.5)'
      : selectedId
        ? 'rgba(140, 170, 220, 0.09)'
        : 'rgba(140, 176, 232, 0.15)';
    ctx.lineWidth = isSelected ? 1.25 : 1;
    ctx.stroke();
  }

  // --- Sun body ---------------------------------------------------------
  const sunCore = ctx.createRadialGradient(
    sunScreenX - sunRadius * 0.22,
    sunScreenY - sunRadius * 0.24,
    sunRadius * 0.1,
    sunScreenX,
    sunScreenY,
    sunRadius,
  );
  sunCore.addColorStop(0, '#fffdf2');
  sunCore.addColorStop(0.45, '#ffe6a6');
  sunCore.addColorStop(0.82, '#ffb663');
  sunCore.addColorStop(1, '#ff9647');
  ctx.fillStyle = sunCore;
  ctx.beginPath();
  ctx.arc(sunScreenX, sunScreenY, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  // --- Planets ----------------------------------------------------------
  const bodies: ScreenBody[] = [];
  const labelQueue: Array<{
    planet: Planet;
    x: number;
    y: number;
    r: number;
    isSelected: boolean;
    priority: number;
  }> = [];
  const detailScale = Math.pow(camera.scale, 0.5);
  const focusing = Boolean(selectedId);

  for (const planet of PLANETS) {
    const world = planetWorldPosition(planet, baseR, simTime);
    const x = cx + (world.x - camera.x) * camera.scale;
    const y = cy + (world.y - camera.y) * camera.scale;
    let r = clamp(planet.visual.size * (unit / 470), 2.1, 34) * detailScale;
    if (frame.lowQuality) r *= 0.92;

    const isSelected = selectedId === planet.id;
    const isHover = hoverId === planet.id;
    const alpha = focusing && !isSelected ? 0.42 : 1;

    bodies.push({ id: planet.id, x, y, r });

    drawBody(
      ctx,
      planet,
      x,
      y,
      r,
      sunScreenX,
      sunScreenY,
      alpha,
      isSelected || isHover,
    );

    const showThisLabel =
      frame.showLabels &&
      (isSelected || frame.zoom > 1.25 || (camera.scale < 1.7 && r > 2.4));
    if (showThisLabel) {
      labelQueue.push({ planet, x, y, r, isSelected, priority: (isSelected ? 100 : 0) + r });
    }
  }

  // Labels are placed after all bodies so busy regions can push them aside.
  labelQueue.sort((a, b) => b.priority - a.priority);
  const takenBoxes: LabelBox[] = [
    {
      x0: sunScreenX - sunRadius * 1.5,
      y0: sunScreenY - sunRadius * 1.5,
      x1: sunScreenX + sunRadius * 1.5,
      y1: sunScreenY + sunRadius * 1.5,
    },
  ];
  const fontSize = Math.max(9, Math.min(12, unit * 0.019));
  for (const entry of labelQueue) {
    const placed = placeLabel(
      ctx,
      entry.planet.name,
      entry.x,
      entry.y,
      entry.r,
      fontSize,
      takenBoxes,
      width,
      height,
    );
    if (!placed) continue;
    ctx.save();
    ctx.globalAlpha = entry.isSelected ? 1 : 0.62;
    ctx.fillStyle = entry.isSelected ? '#e8f3ff' : '#c4d2e8';
    ctx.font = `${entry.isSelected ? 600 : 500} ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = placed.baseline;
    ctx.fillText(entry.planet.name, placed.x, placed.y);
    ctx.restore();
  }

  // --- Pointer highlight ------------------------------------------------
  if (hoverId) {
    const body = bodies.find((entry) => entry.id === hoverId);
    if (body) {
      ctx.strokeStyle = 'rgba(190, 225, 255, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.r + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // --- Vignette ---------------------------------------------------------
  if (!frame.lowQuality) {
    const vignette = ctx.createRadialGradient(
      cx,
      cy,
      Math.min(width, height) * 0.28,
      cx,
      cy,
      Math.max(width, height) * 0.72,
    );
    vignette.addColorStop(0, 'rgba(3,5,12,0)');
    vignette.addColorStop(1, 'rgba(3,5,12,0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  return bodies;
}
