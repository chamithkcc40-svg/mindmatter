import { Link } from 'react-router-dom';
import { Starfield } from '../../components/visuals/Starfield';
import { CelestialVisual } from '../../components/visuals/CelestialVisual';
import { ArrowDown, ArrowRight, Play } from '../../components/icons';

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__ambient" aria-hidden="true">
        <div className="hero__stars">
          <Starfield density={1.05} maxStars={240} />
        </div>
        <div className="hero__nebula hero__nebula--one" />
        <div className="hero__nebula hero__nebula--two" />
        <div className="hero__horizon" />
      </div>

      <div className="shell hero__inner">
        <div className="hero__copy">
          <p className="hero__eyebrow anim-rise" style={{ '--d': '0ms' } as React.CSSProperties}>
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
            <Link className="btn btn--primary" to="/explore/solar-system">
              Explore the Universe
              <ArrowRight className="btn__icon" />
            </Link>
            <a className="btn btn--ghost" href="#experiences">
              <Play className="btn__icon" />
              Discover Science
            </a>
          </div>

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
          <div className="hero__plate glass-panel">
            <span className="hero__plate-label">Now exploring</span>
            <strong>Live Solar System</strong>
            <span className="hero__plate-meta">Eight worlds in motion</span>
            <Link to="/explore/solar-system" className="hero__plate-link">
              Enter
              <ArrowRight width={14} height={14} />
            </Link>
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
