import { Link } from 'react-router-dom';
import { Hero } from '../features/home/Hero';
import { FeaturedExperience } from '../features/home/FeaturedExperience';
import { PrincipleBand } from '../features/home/PrincipleBand';
import { FeatureCard } from '../components/FeatureCard';
import { Reveal } from '../components/Reveal';
import { FEATURES } from '../data/features';
import { ArrowRight } from '../components/icons';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function HomePage() {
  useDocumentTitle('Explore the Universe. Understand Everything.');

  return (
    <>
      <Hero />
      <FeaturedExperience />

      <section className="section experiences" id="experiences" aria-labelledby="experiences-title">
        <div className="shell">
          <Reveal className="section-head section-head--wide">
            <p className="eyebrow">The science collection</p>
            <h2 id="experiences-title" className="h2">
              Seven worlds of science. One place to explore them.
            </h2>
            <p className="lead muted">
              Mind Matter grows one experience at a time. What is live is genuinely
              interactive; what is not yet built says so plainly.
            </p>
          </Reveal>

          <ul className="feature-grid">
            {FEATURES.map((feature, index) => (
              <Reveal as="li" key={feature.id} delay={index * 60}>
                <FeatureCard feature={feature} highlight={feature.id === 'solar-system'} />
              </Reveal>
            ))}
          </ul>

          <Reveal className="experiences__more" delay={120}>
            <p>
              More experiences are in production. The Solar System Explorer is the
              first of them — and it is fully working today.
            </p>
            <Link className="btn btn--ghost" to="/explore" data-lg="button">
              Browse all experiences
              <ArrowRight className="btn__icon" />
            </Link>
          </Reveal>
        </div>
      </section>

      <PrincipleBand />

      <section className="section closing" aria-labelledby="closing-title">
        <div className="shell closing__inner" data-lg="panel">
          <Reveal className="closing__content">
            <p className="eyebrow">Begin anywhere</p>
            <h2 id="closing-title" className="h2 closing__title">
              The universe is one interactive experience away.
            </h2>
            <p className="lead muted closing__lead">
              Start with the solar system. Stand on the map of our neighbourhood, then
              learn why every world out there behaves the way it does.
            </p>
            <div className="closing__actions">
              <Link className="btn btn--primary" to="/explore/solar-system" data-lg="primary">
                Explore the Universe
                <ArrowRight className="btn__icon" />
              </Link>
              <Link className="btn btn--ghost" to="/about" data-lg="button">
                About Mind Matter
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
