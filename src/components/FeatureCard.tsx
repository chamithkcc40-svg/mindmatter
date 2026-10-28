import { Link } from 'react-router-dom';
import { FEATURE_ICONS, ArrowRight } from './icons';
import type { ScienceFeature } from '../data/features';

interface FeatureCardProps {
  feature: ScienceFeature;
  /** Emphasised treatment for the first live module. */
  highlight?: boolean;
}

export function FeatureCard({ feature, highlight = false }: FeatureCardProps) {
  const Icon = FEATURE_ICONS[feature.icon];
  const isLive = feature.status === 'live' && feature.href;

  const inner = (
    <>
      <div className="feature-card__top">
        <span className="feature-card__icon" aria-hidden="true">
          <Icon width={20} height={20} />
        </span>
        {isLive ? (
          <span className="chip chip--live">
            <span className="dot" />
            Live
          </span>
        ) : (
          <span className="chip chip--soon">Coming soon</span>
        )}
      </div>

      <div className="feature-card__body">
        <p className="feature-card__category">{feature.category}</p>
        <h3 className="feature-card__title">{feature.title}</h3>
        <p className="feature-card__blurb">{feature.blurb}</p>
      </div>

      <div className="feature-card__foot">
        <span className="feature-card__meta">{feature.meta}</span>
        {isLive ? (
          <span className="feature-card__go">
            Enter
            <ArrowRight width={15} height={15} />
          </span>
        ) : (
          <span className="feature-card__pending">{feature.note}</span>
        )}
      </div>
    </>
  );

  if (isLive) {
    return (
      <Link
        to={feature.href!}
        className={`feature-card${highlight ? ' feature-card--highlight' : ''}`}
        aria-label={`${feature.title} — open this experience`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <article
      className={`feature-card feature-card--soon${highlight ? ' feature-card--highlight' : ''}`}
      aria-labelledby={`feature-${feature.id}`}
    >
      {inner}
    </article>
  );
}
