import { Link } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { DATA_SOURCES, PLANETS, PLANET_DATASET_UPDATED } from '../data/planets';
import { formatKilometres, formatNumber } from '../lib/format';
import { ArrowRight, Play } from '../components/icons';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function ScienceLibraryPage() {
  useDocumentTitle('Science Library');

  return (
    <div className="page">
      <section className="page-hero">
        <div className="shell">
          <Reveal>
            <p className="eyebrow">Science Library</p>
            <h1 className="h2 page-hero__title">
              The reference shelf behind every experience.
            </h1>
            <p className="lead page-hero__lead">
              Source data and original films from Mind Matter. The video library is
              in production; the planetary reference below is available now and is
              the same dataset the Solar System Explorer uses.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="reference-title">
        <div className="shell">
          <Reveal className="section-head">
            <p className="eyebrow">Reference</p>
            <h2 id="reference-title" className="h2">
              Planetary data sheet
            </h2>
            <p className="muted">
              Mean values, rounded for readability. {DATA_SOURCES} Moon counts are
              current as of {PLANET_DATASET_UPDATED}. 1 AU (astronomical unit) is the
              mean Earth–Sun distance, about 149.6 million km.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div
              className="table-wrap"
              tabIndex={0}
              role="region"
              aria-label="Planetary data sheet, scrollable"
              data-lg="panel"
            >
              <table className="data-table">
                <caption className="visually-hidden">
                  Mean planetary data for the eight planets of the solar system
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Planet</th>
                    <th scope="col">Type</th>
                    <th scope="col">Mean distance from Sun</th>
                    <th scope="col">Diameter</th>
                    <th scope="col">Orbital period</th>
                    <th scope="col">Rotation period</th>
                    <th scope="col">Known moons</th>
                  </tr>
                </thead>
                <tbody>
                  {PLANETS.map((planet) => (
                    <tr key={planet.id}>
                      <th scope="row">
                        <span className="data-table__name">
                          <span
                            className="data-table__dot"
                            aria-hidden="true"
                            style={{ background: planet.palette.base }}
                          />
                          {planet.name}
                        </span>
                      </th>
                      <td>{planet.type}</td>
                      <td>
                        {formatKilometres(planet.meanDistanceKm)}
                        <span className="data-table__sub">{planet.meanDistanceAu} AU</span>
                      </td>
                      <td>{formatNumber(planet.diameterKm)} km</td>
                      <td>{planet.orbitalPeriodLabel}</td>
                      <td>{planet.rotationPeriodLabel}</td>
                      <td>{formatNumber(planet.moons)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal delay={120} className="library__cta">
            <p className="muted">
              Prefer to learn by doing? Open the explorer and see these numbers in
              motion.
            </p>
            <Link className="btn btn--ghost" to="/explore/solar-system" data-lg="button">
              Open the Solar System Explorer
              <ArrowRight className="btn__icon" />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="videos-title">
        <div className="shell">
          <Reveal className="coming-panel" surface="panel">
            <div className="coming-panel__icon" aria-hidden="true">
              <Play width={20} height={20} />
            </div>
            <div className="coming-panel__body">
              <span className="chip chip--soon">Coming soon</span>
              <h2 id="videos-title" className="h3">
                Science Video Library
              </h2>
              <p className="muted">
                Original Mind Matter films and explainers will be published here,
                with transcripts and the references behind each claim. Nothing is
                published yet — when the first films are ready, they will appear on
                this page.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
