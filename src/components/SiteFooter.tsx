import { Link } from 'react-router-dom';
import { Wordmark } from './Wordmark';
import { LIVE_FEATURES } from '../data/features';
import { ArrowRight } from './icons';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Link to="/" aria-label="Mind Matter — home">
              <Wordmark size={32} />
            </Link>
            <p>
              An independent science studio building interactive experiences that
              make the universe feel close enough to touch.
            </p>
          </div>

          <div className="site-footer__col">
            <h2 className="site-footer__heading">Experiences</h2>
            <ul>
              {LIVE_FEATURES.map((feature) => (
                <li key={feature.id}>
                  <Link to={feature.href ?? '/explore'}>{feature.title}</Link>
                </li>
              ))}
              <li>
                <Link to="/explore">All experiences</Link>
              </li>
            </ul>
          </div>

          <div className="site-footer__col">
            <h2 className="site-footer__heading">Studio</h2>
            <ul>
              <li>
                <Link to="/about">About Mind Matter</Link>
              </li>
              <li>
                <Link to="/science-library">Science Library</Link>
              </li>
              <li>
                <Link to="/about#principles">Our principles</Link>
              </li>
            </ul>
          </div>

          <div className="site-footer__col site-footer__col--wide">
            <h2 className="site-footer__heading">Start exploring</h2>
            <p className="site-footer__note">
              The Solar System Explorer runs entirely in your browser. No accounts,
              no downloads, no API keys.
            </p>
            <Link className="site-footer__cta" to="/explore/solar-system">
              Enter the Solar System
              <ArrowRight width={16} height={16} />
            </Link>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>© {new Date().getFullYear()} Mind Matter. Built for the curious.</p>
          <p className="site-footer__fine">
            Planet data: NASA fact sheets &amp; IAU Minor Planet Center (March 2025).
            Orbital motion in the explorer is an educational simulation, not live
            telemetry.
          </p>
        </div>
      </div>
    </footer>
  );
}
