import { Link } from 'react-router-dom';
import { FeatureCard } from '../components/FeatureCard';
import { Reveal } from '../components/Reveal';
import { FEATURES } from '../data/features';
import { ArrowRight, Info } from '../components/icons';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function ExplorePage() {
  useDocumentTitle('Explore');

  return (
    <div className="page">
      <div className="page__ambient" aria-hidden="true">
        <div className="page__nebula" />
      </div>

      <section className="page-hero">
        <div className="shell">
          <Reveal>
            <p className="eyebrow">Explore</p>
            <h1 className="h2 page-hero__title">Interactive science, one experience at a time.</h1>
            <p className="lead page-hero__lead">
              Each Mind Matter experience is built to be operated rather than skimmed.
              Live modules work fully offline in your browser. Modules still in
              production are labelled, never faked.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="all-experiences">
        <div className="shell">
          <Reveal className="section-head">
            <h2 id="all-experiences" className="h2">
              The collection
            </h2>
            <p className="muted">
              One live simulation, six experiences in development.
            </p>
          </Reveal>

          <ul className="feature-grid">
            {FEATURES.map((feature, index) => (
              <Reveal as="li" key={feature.id} delay={index * 55}>
                <FeatureCard feature={feature} highlight={feature.id === 'solar-system'} />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="live-now">
        <div className="shell">
          <Reveal className="callout">
            <div className="callout__icon" aria-hidden="true">
              <Info width={18} height={18} />
            </div>
            <div className="callout__body">
              <h2 id="live-now" className="h3">
                Available now: the Solar System Explorer
              </h2>
              <p className="muted">
                A real simulation with pause, speed, zoom, planet selection and a
                sourced data panel for all eight planets. No API keys, no accounts.
              </p>
            </div>
            <Link className="btn btn--primary" to="/explore/solar-system">
              Open the explorer
              <ArrowRight className="btn__icon" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
