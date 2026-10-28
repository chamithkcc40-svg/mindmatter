/**
 * Structured planetary dataset for the Mind Matter Solar System Explorer.
 *
 * Sources: NASA planetary fact sheets and the IAU Minor Planet Center moon
 * counts published in March 2025. Figures are rounded for readability and are
 * static reference data — they are not fetched from a live service.
 *
 * Orbital positions in the simulation are generated locally from the sidereal
 * orbital periods below. They illustrate relative motion; they are not an
 * ephemeris and do not show where the planets are today.
 */

export type PlanetId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

export interface PlanetPalette {
  /** Lit limb colour. */
  light: string;
  /** Core / body colour. */
  base: string;
  /** Dark limb colour. */
  dark: string;
  /** Atmospheric halo. */
  glow: string;
}

export interface PlanetVisual {
  /** 0–1 normalised orbit radius used by the artistically compressed layout. */
  orbit: number;
  /** Relative rendered diameter in CSS pixels at zoom 1 on a 1x display. */
  size: number;
  /** Optional ring system drawn as an inclined ellipse. */
  ring?: { inner: number; outer: number; tilt: number; color: string };
}

export interface Planet {
  id: PlanetId;
  name: string;
  type: string;
  order: number;
  tagline: string;
  meanDistanceKm: number;
  meanDistanceAu: number;
  diameterKm: number;
  orbitalPeriodDays: number;
  orbitalPeriodLabel: string;
  rotationPeriodLabel: string;
  moons: number;
  /** Date the moon count was current. */
  moonsAsOf: string;
  facts: [string, ...string[]];
  palette: PlanetPalette;
  visual: PlanetVisual;
  /** Starting angle in the simulated epoch, in degrees. Illustrative only. */
  startAngleDeg: number;
}

export const PLANET_DATASET_UPDATED = 'March 2025';
export const DATA_SOURCES =
  'NASA planetary fact sheets; IAU Minor Planet Center moon counts (March 2025).';

const million = 1_000_000;

export const PLANETS: Planet[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'Terrestrial planet',
    order: 1,
    tagline: 'The swift, scorched innermost world',
    meanDistanceKm: 57.9 * million,
    meanDistanceAu: 0.39,
    diameterKm: 4_879,
    orbitalPeriodDays: 88.0,
    orbitalPeriodLabel: '88 Earth days',
    rotationPeriodLabel: '58.6 Earth days',
    moons: 0,
    moonsAsOf: 'March 2025',
    facts: [
      'Surface temperatures swing from about 430 °C in daylight to −180 °C at night — the widest range of any planet.',
      'Its iron core fills roughly 85% of the planet’s radius, making Mercury unusually dense for its size.',
    ],
    palette: {
      light: '#c9c1b6',
      base: '#9a9187',
      dark: '#3a3530',
      glow: 'rgba(196, 186, 172, 0.35)',
    },
    visual: { orbit: 0.19, size: 4.4 },
    startAngleDeg: 42,
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'Terrestrial planet',
    order: 2,
    tagline: 'A greenhouse world beneath golden clouds',
    meanDistanceKm: 108.2 * million,
    meanDistanceAu: 0.72,
    diameterKm: 12_104,
    orbitalPeriodDays: 224.7,
    orbitalPeriodLabel: '224.7 Earth days',
    rotationPeriodLabel: '243 Earth days (retrograde)',
    moons: 0,
    moonsAsOf: 'March 2025',
    facts: [
      'Venus spins backwards, and so slowly that one rotation takes longer than its entire orbit around the Sun.',
      'Its dense carbon-dioxide atmosphere traps heat, holding the surface near 465 °C — hot enough to melt lead.',
    ],
    palette: {
      light: '#ffedc4',
      base: '#e3b775',
      dark: '#6b4a22',
      glow: 'rgba(255, 203, 130, 0.4)',
    },
    visual: { orbit: 0.265, size: 6.4 },
    startAngleDeg: 128,
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'Terrestrial planet',
    order: 3,
    tagline: 'The only known world with life',
    meanDistanceKm: 149.6 * million,
    meanDistanceAu: 1.0,
    diameterKm: 12_742,
    orbitalPeriodDays: 365.256,
    orbitalPeriodLabel: '365.25 Earth days',
    rotationPeriodLabel: '23 h 56 m',
    moons: 1,
    moonsAsOf: 'March 2025',
    facts: [
      'Earth is the only place where liquid surface water is known to remain stable over geological time.',
      'Its magnetic field deflects most of the solar wind, helping to preserve the atmosphere above us.',
    ],
    palette: {
      light: '#a9dcff',
      base: '#3f8fd4',
      dark: '#0d2d55',
      glow: 'rgba(110, 180, 255, 0.5)',
    },
    visual: { orbit: 0.345, size: 6.8 },
    startAngleDeg: 248,
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'Terrestrial planet',
    order: 4,
    tagline: 'The rust-red desert next door',
    meanDistanceKm: 228.0 * million,
    meanDistanceAu: 1.52,
    diameterKm: 6_779,
    orbitalPeriodDays: 686.98,
    orbitalPeriodLabel: '687 Earth days',
    rotationPeriodLabel: '24 h 37 m',
    moons: 2,
    moonsAsOf: 'March 2025',
    facts: [
      'Olympus Mons rises about 22 km above the surrounding plains — roughly two and a half times the height of Everest.',
      'Dry river valleys and lake beds show that liquid water once flowed across the Martian surface.',
    ],
    palette: {
      light: '#ffc9a3',
      base: '#c9613a',
      dark: '#4a1d10',
      glow: 'rgba(255, 138, 96, 0.4)',
    },
    visual: { orbit: 0.43, size: 5.6 },
    startAngleDeg: 12,
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'Gas giant',
    order: 5,
    tagline: 'A world of storms larger than planets',
    meanDistanceKm: 778.5 * million,
    meanDistanceAu: 5.2,
    diameterKm: 139_820,
    orbitalPeriodDays: 4_332.59,
    orbitalPeriodLabel: '11.86 Earth years',
    rotationPeriodLabel: '9 h 56 m',
    moons: 95,
    moonsAsOf: 'March 2025',
    facts: [
      'Jupiter is more massive than all the other planets in the solar system combined — by about 2.5 times.',
      'The Great Red Spot is an anticyclonic storm wider than Earth, observed continuously since at least 1831.',
    ],
    palette: {
      light: '#f6e3c8',
      base: '#c9a176',
      dark: '#4a3320',
      glow: 'rgba(235, 195, 150, 0.4)',
    },
    visual: { orbit: 0.595, size: 12.2 },
    startAngleDeg: 305,
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'Gas giant',
    order: 6,
    tagline: 'The ringed jewel of the outer system',
    meanDistanceKm: 1_432 * million,
    meanDistanceAu: 9.58,
    diameterKm: 116_460,
    orbitalPeriodDays: 10_759.22,
    orbitalPeriodLabel: '29.45 Earth years',
    rotationPeriodLabel: '10 h 33 m',
    moons: 274,
    moonsAsOf: 'March 2025',
    facts: [
      'Saturn’s average density is lower than that of water — in a large enough ocean, it would float.',
      'Its bright rings are made mostly of water ice, and in places are only tens of metres thick.',
    ],
    palette: {
      light: '#f8ecc9',
      base: '#d8bd85',
      dark: '#584327',
      glow: 'rgba(245, 220, 165, 0.42)',
    },
    visual: {
      orbit: 0.705,
      size: 10.4,
      ring: {
        inner: 1.35,
        outer: 2.25,
        tilt: -0.36,
        color: 'rgba(238, 222, 186, 0.75)',
      },
    },
    startAngleDeg: 196,
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'Ice giant',
    order: 7,
    tagline: 'The tilted, methane-blue giant',
    meanDistanceKm: 2_867 * million,
    meanDistanceAu: 19.2,
    diameterKm: 50_724,
    orbitalPeriodDays: 30_688.5,
    orbitalPeriodLabel: '84.0 Earth years',
    rotationPeriodLabel: '17 h 14 m (retrograde)',
    moons: 28,
    moonsAsOf: 'March 2025',
    facts: [
      'Uranus is tipped about 98° on its side, so each pole receives 42 years of continuous daylight followed by 42 years of darkness.',
      'It was the first planet found with a telescope, identified by William Herschel in 1781.',
    ],
    palette: {
      light: '#c6f4f7',
      base: '#8ad4dc',
      dark: '#1c4a54',
      glow: 'rgba(150, 235, 245, 0.42)',
    },
    visual: {
      orbit: 0.81,
      size: 8.6,
      ring: {
        inner: 1.7,
        outer: 1.95,
        tilt: 1.35,
        color: 'rgba(170, 220, 235, 0.35)',
      },
    },
    startAngleDeg: 88,
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'Ice giant',
    order: 8,
    tagline: 'The windiest world we know',
    meanDistanceKm: 4_515 * million,
    meanDistanceAu: 30.1,
    diameterKm: 49_244,
    orbitalPeriodDays: 60_182,
    orbitalPeriodLabel: '164.8 Earth years',
    rotationPeriodLabel: '16 h 6 m',
    moons: 16,
    moonsAsOf: 'March 2025',
    facts: [
      'Neptune was predicted mathematically before it was observed; it was found in 1846 within a degree of the prediction.',
      'Its winds reach roughly 2,000 km/h, the fastest measured anywhere in the solar system.',
    ],
    palette: {
      light: '#a9c4ff',
      base: '#3f6ae0',
      dark: '#111f52',
      glow: 'rgba(110, 150, 255, 0.45)',
    },
    visual: { orbit: 0.9, size: 8.4 },
    startAngleDeg: 330,
  },
];

export const PLANET_BY_ID: Record<PlanetId, Planet> = Object.fromEntries(
  PLANETS.map((planet) => [planet.id, planet]),
) as Record<PlanetId, Planet>;

export const SUN = {
  name: 'Sun',
  type: 'G-type main-sequence star',
  diameterKm: 1_391_400,
  facts: [
    'The Sun holds about 99.86% of the mass of the entire solar system.',
    'Energy made in its core takes thousands of years to reach the surface, then only about eight minutes to reach Earth.',
  ],
};
