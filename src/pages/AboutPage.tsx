import { Link } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { ArrowRight, Info } from '../components/icons';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const APPROACH = [
  {
    title: 'Operate, then understand',
    body: 'Every experience begins with a control you can touch: time, scale, speed, selection. The explanation arrives once you have something to explain.',
  },
  {
    title: 'Say what is real',
    body: 'A simulation is labelled a simulation. Static datasets are dated and sourced. No live feed is claimed unless one is actually connected.',
  },
  {
    title: 'Earn attention, don’t steal it',
    body: 'Cinematic presentation should serve the science — atmosphere, depth and motion, without noise, pop-ups, autoplay or dark patterns.',
  },
];

const BUILD_NOTES = [
  ['Rendering', 'Canvas 2D, one requestAnimationFrame loop, drawn only while visible'],
  ['Runtime', 'React and TypeScript, built with Vite. No 3D engine, no tracking scripts'],
  ['Data', 'Small local datasets — NASA fact sheets and IAU moon counts'],
  ['Access', 'Keyboard controls, visible focus states and a reduced-motion path'],
];

export function AboutPage() {
  useDocumentTitle('About');

  return (
    <div className="page">
      <section className="page-hero">
        <div className="shell">
          <Reveal>
            <p className="eyebrow">About</p>
            <h1 className="h2 page-hero__title">
              Science is a place you can walk around in.
            </h1>
            <p className="lead page-hero__lead">
              Mind Matter is an independent science studio. We build interactive
              experiences that turn explanations into things you can hold, turn and
              break — because understanding arrives through curiosity, not through
              being told.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="story-title">
        <div className="shell about__story">
          <Reveal>
            <p className="eyebrow">The idea</p>
            <h2 id="story-title" className="h2">
              From the smallest particles to the largest galaxies.
            </h2>
          </Reveal>
          <Reveal delay={90} className="about__prose">
            <p>
              Most science on the internet is a wall of text with a stock photo of a
              nebula at the top. It is accurate, and forgettable. The questions that
              actually pull people in — what would happen if Jupiter vanished? how
              small is an atom, really? — are questions about relationships, scale
              and motion. Those are hard to put into sentences and easy to put on a
              screen.
            </p>
            <p>
              So Mind Matter is built as a set of explorable worlds. The solar system
              is the first: eight planets, one star, real orbital periods driving a
              simulation you can slow down, pause, and inspect planet by planet. The
              physics lab, chemistry bench, human biology atlas and mathematics rooms
              are next.
            </p>
            <p>
              Nothing here requires an account, a download, or a graphics card.
              Everything runs in the browser you already have.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section section--tight" id="principles" aria-labelledby="principles-about-title">
        <div className="shell">
          <Reveal className="section-head">
            <p className="eyebrow">Principles</p>
            <h2 id="principles-about-title" className="h2">
              Three rules we hold ourselves to
            </h2>
          </Reveal>

          <ol className="about__approach" data-lg="panel">
            {APPROACH.map((item, index) => (
              <Reveal as="li" key={item.title} delay={index * 80}>
                <span className="about__approach-index">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="h3">{item.title}</h3>
                <p className="muted">{item.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="methods-title">
        <div className="shell about__methods">
          <Reveal className="about__methods-copy">
            <p className="eyebrow">Methods</p>
            <h2 id="methods-title" className="h2">
              How this site is built
            </h2>
            <p className="muted">
              The Solar System Explorer draws a two-dimensional orrery on a canvas.
              Planet sizes and orbital radii are compressed to fit one screen;
              orbital periods are real and set the relative speeds, which are then
              slowed and compressed for observation. Positions are generated locally
              and are not an ephemeris.
            </p>
            <div className="about__note" data-lg="row">
              <Info width={16} height={16} />
              <p>
                No live astronomy API is connected. The word “Live” in “Live Solar
                System” describes continuous motion, not real-time telemetry.
              </p>
            </div>
            <Link className="btn btn--primary" to="/explore/solar-system" data-lg="primary">
              See it for yourself
              <ArrowRight className="btn__icon" />
            </Link>
          </Reveal>

          <Reveal delay={100} className="about__specs">
            <dl data-lg="panel">
              {BUILD_NOTES.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
