import { Link } from 'react-router-dom';
import { CelestialVisual } from '../../components/visuals/CelestialVisual';
import { ArrowDown, ArrowRight, Play } from '../../components/icons';

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="shell hero__inner">
        <div className="hero__copy">
          <p
            className="hero__eyebrow anim-rise"
            data-lg="chip"
            data-lg-radius="999"
            style={{ '--d': '0ms' } as React.CSSProperties}
          >
            <span className="dot" />
            Interactive science studio
          </p>

          <h1 id="hero-title" className="display hero__title">
            <span className="hero__line anim-rise" style={{ '--d': '90ms' } as React.CSSProperties}>
              Explore the Universe.
            </span>
            <span
              className="hero__line hero__line--accent gradient-text anim-rise"
              style={{ '--d': '190ms' } as React.CSSProperties}
            >
              Understand Everything.
            </span>
          </h1>

          <p className="lead hero__sub anim-rise" style={{ '--d': '300ms' } as React.CSSProperties}>
            From the smallest particles to the largest galaxies, discover the
            science behind everything.
          </p>

          <div className="hero__actions anim-rise" style={{ '--d': '400ms' } as React.CSSProperties}>
            <Link className="btn btn--primary" to="/explore/solar-system" data-lg="primary">
              Explore the Universe
              <ArrowRight className="btn__icon" />
            </Link>
            <a className="btn btn--ghost" href="#experiences" data-lg="button">
              <Play className="btn__icon" />
              Discover Science
            </a>
          </div>

          <Link
            to="/explore/solar-system"
            className="hero__plate anim-rise"
            data-lg="plate"
            style={{ '--d': '470ms' } as React.CSSProperties}
          >
            <span className="hero__plate-orb" aria-hidden="true" />
            <span className="hero__plate-copy">
              <span className="hero__plate-label">Now exploring</span>
              <strong>Live Solar System</strong>
              <span className="hero__plate-meta">Eight worlds in motion</span>
            </span>
            <span className="hero__plate-link">
              Enter
              <ArrowRight width={14} height={14} />
            </span>
          </Link>

          <dl className="hero__meta anim-rise" style={{ '--d': '520ms' } as React.CSSProperties}>
            <div>
              <dt>Simulation</dt>
              <dd>Runs locally in your browser</dd>
            </div>
            <div>
              <dt>Planets</dt>
              <dd>Eight, accurately described</dd>
            </div>
            <div>
              <dt>Accounts</dt>
              <dd>None required, ever</dd>
            </div>
          </dl>
        </div>

        <div className="hero__visual anim-fade" style={{ '--d': '260ms' } as React.CSSProperties}>
          <div className="hero__visual-mask">
            <CelestialVisual />
          </div>
        </div>
      </div>

      <a className="hero__scroll" href="#featured" aria-label="Scroll to the featured experience">
        <span className="hero__scroll-track" aria-hidden="true">
          <span className="hero__scroll-dot" />
        </span>
        <span className="hero__scroll-text">Scroll to explore</span>
        <ArrowDown width={14} height={14} aria-hidden="true" />
      </a>
    </section>
  );
}
