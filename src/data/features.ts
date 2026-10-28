/**
 * The Mind Matter experience catalogue. This is the single place to register a
 * new interactive module: add an entry here plus a route, and the homepage grid,
 * the explore page and the navigation all pick it up.
 */

export type FeatureStatus = 'live' | 'soon';

export interface ScienceFeature {
  id: string;
  title: string;
  category: string;
  blurb: string;
  status: FeatureStatus;
  /** Internal route, only used for live features. */
  href?: string;
  /** Short capability line shown on the card. */
  meta: string;
  icon: 'orbit' | 'atom' | 'flask' | 'dna' | 'sigma' | 'spark' | 'play';
  /** A short, honest note for non-live modules. */
  note?: string;
}

export const FEATURES: ScienceFeature[] = [
  {
    id: 'solar-system',
    title: 'Solar System Explorer',
    category: 'Space & Astronomy',
    blurb:
      'Travel across our cosmic neighbourhood. Explore the planets, trace their orbits, and uncover the science of our solar system.',
    status: 'live',
    href: '/explore/solar-system',
    meta: '8 planets · interactive simulation',
    icon: 'orbit',
  },
  {
    id: 'physics-lab',
    title: 'Physics Lab',
    category: 'Physics',
    blurb:
      'Build intuition for motion, gravity and energy with experiments you can run, pause and adjust in real time.',
    status: 'soon',
    meta: 'Interactive experiments',
    icon: 'atom',
    note: 'In development',
  },
  {
    id: 'chemistry-lab',
    title: 'Chemistry Lab',
    category: 'Chemistry',
    blurb:
      'Roam the periodic table and assemble molecules to see how atoms bond, bend and rearrange.',
    status: 'soon',
    meta: 'Elements & molecules',
    icon: 'flask',
    note: 'In development',
  },
  {
    id: 'human-biology',
    title: 'Human Biology',
    category: 'Biology',
    blurb:
      'Journey from DNA to organs to whole body systems, and see how the machinery of you fits together.',
    status: 'soon',
    meta: 'Cells, organs & DNA',
    icon: 'dna',
    note: 'In development',
  },
  {
    id: 'maths-for-life',
    title: 'Maths for Life',
    category: 'Mathematics',
    blurb:
      'Discover the mathematics hiding in queues, music, weather and the way a sunflower grows.',
    status: 'soon',
    meta: 'Mathematics in the everyday',
    icon: 'sigma',
    note: 'In development',
  },
  {
    id: 'mind-blowing-science',
    title: 'Mind-Blowing Science',
    category: 'Discoveries',
    blurb:
      'The results that reorganised how we see reality — explained clearly, and without the hype.',
    status: 'soon',
    meta: 'Curated discoveries',
    icon: 'spark',
    note: 'In development',
  },
  {
    id: 'science-videos',
    title: 'Science Video Library',
    category: 'Video',
    blurb:
      'Every Mind Matter film and explainer, gathered in one calm, searchable place.',
    status: 'soon',
    meta: 'Original Mind Matter films',
    icon: 'play',
    note: 'Publishing soon',
  },
];

export const LIVE_FEATURES = FEATURES.filter((feature) => feature.status === 'live');
