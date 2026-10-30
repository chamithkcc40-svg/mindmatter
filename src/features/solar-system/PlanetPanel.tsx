import type { Planet } from '../../data/planets';
import { PLANET_DATASET_UPDATED, PLANETS, SUN } from '../../data/planets';
import { formatKilometres, formatNumber } from '../../lib/format';
import { ArrowLeft, ArrowRight, Close, Info } from '../../components/icons';

interface PlanetPanelProps {
  planet: Planet | null;
  onClear: () => void;
  onSelect: (id: Planet['id']) => void;
}

export function PlanetPanel({ planet, onClear, onSelect }: PlanetPanelProps) {
  if (!planet) {
    return (
      <div className="planet-panel planet-panel--overview">
        <div className="planet-panel__head">
          <p className="eyebrow">System overview</p>
          <h2 className="planet-panel__title">Our solar system</h2>
          <p className="planet-panel__tagline">
            One star, eight planets, and a great deal of space in between.
          </p>
        </div>

        <div className="panel-card">
          <div className="panel-card__title-row">
            <span className="panel-card__sun" aria-hidden="true" />
            <h3 className="panel-card__title">{SUN.name}</h3>
            <span className="chip">{SUN.type}</span>
          </div>
          <dl className="stat-grid stat-grid--compact">
            <div>
              <dt>Diameter</dt>
              <dd>{formatKilometres(SUN.diameterKm)}</dd>
            </div>
            <div>
              <dt>Mass share</dt>
              <dd>99.86% of the system</dd>
            </div>
          </dl>
          <ul className="fact-list">
            {SUN.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </div>

        <div className="panel-hint">
          <Info width={16} height={16} />
          <div>
            <p>
              Select a planet on the map, or choose one from the planet rail, to see
              its data and the science behind it.
            </p>
            <p>
              Drag-free controls: use <kbd>Space</kbd> to pause, <kbd>+</kbd>/
              <kbd>−</kbd> to zoom, <kbd>Esc</kbd> to return to the full system.
            </p>
          </div>
        </div>

        <div className="panel-card panel-card--quiet">
          <h3 className="panel-card__subtitle">About this simulation</h3>
          <p>
            Planet sizes and orbital distances are compressed so all eight worlds
            fit on one screen. Orbital <em>periods</em> are real, and they set the
            relative speeds you see — but the speeds themselves are slowed down for
            observation, and then further compressed so distant Neptune still moves.
          </p>
          <p>
            The planet positions are generated locally from those periods. They are
            not current positions, and no live astronomical feed is connected.
          </p>
          <p className="panel-card__source">
            Static data: NASA planetary fact sheets. Moon counts: IAU Minor Planet
            Center, current as of {PLANET_DATASET_UPDATED}.
          </p>
        </div>
      </div>
    );
  }

  const index = PLANETS.findIndex((entry) => entry.id === planet.id);
  const previous = PLANETS[(index - 1 + PLANETS.length) % PLANETS.length];
  const next = PLANETS[(index + 1) % PLANETS.length];

  return (
    <div className="planet-panel" key={planet.id}>
      <div className="planet-panel__head">
        <div className="planet-panel__head-row">
          <p className="eyebrow">Planet {String(planet.order).padStart(2, '0')}</p>
          <button
            type="button"
            className="planet-panel__close"
            onClick={onClear}
            data-lg="chip"
          >
            <Close width={15} height={15} />
            Full system
          </button>
        </div>
        <div className="planet-panel__title-row">
          <span
            className="planet-panel__orb"
            aria-hidden="true"
            style={{
              background: `radial-gradient(circle at 32% 30%, ${planet.palette.light}, ${planet.palette.base} 62%, ${planet.palette.dark})`,
              boxShadow: `0 0 22px ${planet.palette.glow}`,
            }}
          />
          <h2 className="planet-panel__title">{planet.name}</h2>
        </div>
        <p className="planet-panel__type">{planet.type}</p>
        <p className="planet-panel__tagline">{planet.tagline}</p>
      </div>

      <dl className="stat-grid">
        <div>
          <dt>Mean distance from Sun</dt>
          <dd>
            {formatKilometres(planet.meanDistanceKm)}
            <span className="stat-grid__sub">{planet.meanDistanceAu} AU</span>
          </dd>
        </div>
        <div>
          <dt>Equatorial diameter</dt>
          <dd>{formatNumber(planet.diameterKm)} km</dd>
        </div>
        <div>
          <dt>Orbital period</dt>
          <dd>{planet.orbitalPeriodLabel}</dd>
        </div>
        <div>
          <dt>Rotation period</dt>
          <dd>{planet.rotationPeriodLabel}</dd>
        </div>
        <div>
          <dt>Known moons</dt>
          <dd>
            {formatNumber(planet.moons)}
            <span className="stat-grid__sub">as of {planet.moonsAsOf}</span>
          </dd>
        </div>
        <div>
          <dt>Position from Sun</dt>
          <dd>
            {planet.order} of 8<span className="stat-grid__sub">1 AU ≈ 149.6 million km</span>
          </dd>
        </div>
      </dl>

      <div className="planet-panel__facts">
        <h3 className="panel-card__subtitle">What makes it remarkable</h3>
        <ul className="fact-list">
          {planet.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>

      <div className="planet-panel__pager">
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => onSelect(previous.id)}
          aria-label={`Previous planet: ${previous.name}`}
          data-lg="button"
        >
          <ArrowLeft width={15} height={15} />
          {previous.name}
        </button>
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => onSelect(next.id)}
          aria-label={`Next planet: ${next.name}`}
          data-lg="button"
        >
          {next.name}
          <ArrowRight width={15} height={15} />
        </button>
      </div>

      <p className="planet-panel__disclaimer">
        Distances and diameters are rounded mean values. Orbital motion on screen is
        a scaled illustration, not an ephemeris.
      </p>
    </div>
  );
}
