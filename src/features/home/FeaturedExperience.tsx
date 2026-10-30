import { Link } from 'react-router-dom';
import { SolarSystemCanvas } from '../solar-system/SolarSystemCanvas';
import { Reveal } from '../../components/Reveal';
import { LiquidGlassLayer } from '../../liquid-glass';
import { ArrowRight, Info, Orbit } from '../../components/icons';
import { PLANETS } from '../../data/planets';

const HIGHLIGHTS = [
  { value: '8', label: 'planets in motion' },
  { value: '360°', label: 'orbital paths' },
  { value: '0', label: 'downloads' },
];

/**
 * The homepage centrepiece. The preview is a real simulation (paused by default
 * to stay cheap), and the whole card links to the interactive explorer.
 */
export function FeaturedExperience() {
  return (
    <section className="section featured" id="featured" aria-labelledby="featured-title">
      <div className="shell">
        <Reveal className="featured__head">
          <div>
            <p className="eyebrow">Featured experience</p>
            <h2 id="featured-title" className="h2 featured__title">
              Explore the Live Solar System
            </h2>
          </div>
          <p className="lead featured__lead">
            Travel across our cosmic neighbourhood. Discover the planets, explore
            their orbits, and uncover the science of our solar system.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <Link
            to="/explore/solar-system"
            className="featured-card"
            data-lg="panel"
          >
            <div className="featured-card__stage">
              <SolarSystemCanvas
                paused
                speed={1}
                zoom={1}
                showLabels
                showBelt
                lowQuality
                selectedId={null}
                label="Animated preview of the solar system: eight planets orbiting the Sun on visible orbital paths"
              />
              <div className="featured-card__scrim" aria-hidden="true" />

              {/* Glass above the simulator artwork lives in its own region layer. */}
              <LiquidGlassLayer layer="featured" mode="region" />

              <div className="featured-card__badges">
                <span className="chip chip--live" data-lg="chip" data-lg-layer="featured">
                  <span className="dot" />
                  Interactive
                </span>
                <span className="chip" data-lg="chip" data-lg-layer="featured">
                  Educational simulation
                </span>
              </div>

              <ol
                className="featured-card__legend"
                aria-label="Planets shown, in order from the Sun"
                data-lg="pill"
                data-lg-layer="featured"
              >
                {PLANETS.map((planet) => (
                  <li key={planet.id}>
                    <span
                      className="featured-card__swatch"
                      style={{
                        background: planet.palette.base,
                        boxShadow: `0 0 10px ${planet.palette.glow}`,
                      }}
                      aria-hidden="true"
                    />
                    {planet.name}
                  </li>
                ))}
              </ol>
            </div>

            <div className="featured-card__body">
              <div className="featured-card__body-main">
                <div className="featured-card__heading">
                  <span className="featured-card__icon">
                    <Orbit width={22} height={22} />
                  </span>
                  <div>
                    <h3 className="h3">Solar System Explorer</h3>
                    <p className="muted featured-card__sub">
                      Pause time, change its speed, zoom, and select any planet for
                      data and the science behind it.
                    </p>
                  </div>
                </div>

                <dl className="featured-card__stats">
                  {HIGHLIGHTS.map((item) => (
                    <div key={item.label}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="featured-card__action">
                <span className="featured-card__cta" data-lg="primary">
                  Enter Solar System
                  <ArrowRight className="btn__icon" />
                </span>
                <span className="featured-card__note">
                  <Info width={13} height={13} />
                  Not to scale · not live telemetry
                </span>
              </div>
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
