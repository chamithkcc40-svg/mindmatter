import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SolarSystemCanvas } from '../features/solar-system/SolarSystemCanvas';
import { SimulationControls } from '../features/solar-system/SimulationControls';
import { PlanetPanel } from '../features/solar-system/PlanetPanel';
import { LiquidGlassLayer } from '../liquid-glass';
import { ArrowLeft, Info } from '../components/icons';
import { PLANET_BY_ID, type PlanetId } from '../data/planets';
import { clamp } from '../lib/format';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useLowPowerDevice } from '../hooks/useLowPowerDevice';
import { useReducedMotion } from '../hooks/useReducedMotion';

const ZOOM_MIN = 0.7;
const ZOOM_MAX = 2.4;
const ZOOM_STEP = 0.15;

export function SolarSystemPage() {
  useDocumentTitle('Solar System Explorer');
  const reducedMotion = useReducedMotion();
  const lowPower = useLowPowerDevice();

  const [paused, setPaused] = useState(reducedMotion);
  const [speed, setSpeed] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState<PlanetId | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const panelRef = useRef<HTMLDivElement | null>(null);
  const selectedPlanet = selectedId ? PLANET_BY_ID[selectedId] : null;

  // Respect the user's motion preference when it changes mid-session.
  useEffect(() => {
    if (reducedMotion) setPaused(true);
  }, [reducedMotion]);

  const selectPlanet = useCallback((id: PlanetId | null) => {
    setSelectedId(id);
    setAnnouncement(
      id ? `${PLANET_BY_ID[id].name} selected. Details updated.` : 'Full system view.',
    );
    requestAnimationFrame(() => {
      if (panelRef.current) panelRef.current.scrollTop = 0;
      // On stacked layouts the panel sits below the stage, so bring it into view.
      if (
        id &&
        window.matchMedia?.('(max-width: 980px)').matches &&
        panelRef.current
      ) {
        panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setSelectedId(null);
    setAnnouncement('View reset to the full solar system.');
  }, []);

  const zoomIn = useCallback(() => setZoom((value) => clamp(value + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX)), []);
  const zoomOut = useCallback(() => setZoom((value) => clamp(value - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX)), []);

  // Keyboard shortcuts for the simulation, ignored while a form control is focused.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const isFormControl =
        tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A';

      if (event.key === 'Escape') {
        if (selectedId) {
          event.preventDefault();
          selectPlanet(null);
        }
        return;
      }
      if (isFormControl) return;

      if (event.code === 'Space') {
        event.preventDefault();
        setPaused((value) => !value);
      } else if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        zoomIn();
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        zoomOut();
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        resetView();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, selectPlanet, resetView, zoomIn, zoomOut]);

  return (
    <div className="explorer">
      <div className="explorer__bar" data-lg="bar">
        <div className="shell explorer__bar-inner">
          <Link to="/" className="explorer__back" data-lg="chip">
            <ArrowLeft width={16} height={16} />
            Mind Matter
          </Link>
          <div className="explorer__titles">
            <h1 className="explorer__title">
              Live Solar System
              <span className="chip chip--live">
                <span className="dot" />
                Live simulation
              </span>
            </h1>
            <p className="explorer__sub">
              Eight worlds in continuous motion. Select a planet to explore its
              data, or take the controls below.
            </p>
          </div>
          <span className="chip explorer__bar-chip" data-lg="chip">
            Educational simulation
          </span>
        </div>
      </div>

      <div className="explorer__body">
        <section className="explorer__stage" aria-label="Solar system visualisation">
          <SolarSystemCanvas
            selectedId={selectedId}
            onSelect={selectPlanet}
            paused={paused}
            speed={speed}
            zoom={zoom}
            focusSelected
            interactive
            lowQuality={lowPower}
            showLabels
            showBelt
            label={`Simulated solar system. ${selectedPlanet ? `${selectedPlanet.name} is selected.` : 'All eight planets are visible.'} Use the planet buttons for a text description.`}
          />

          {/* Glass above the simulation artwork, in its own region layer. */}
          <LiquidGlassLayer layer="stage" mode="region" />

          <div className="explorer__stage-note" data-lg="chip" data-lg-layer="stage">
            <Info width={14} height={14} />
            <span>
              Sizes and distances artistically compressed · orbital motion simulated
              locally, not live positions
            </span>
          </div>

          <div className="explorer__controls-dock">
            <SimulationControls
              paused={paused}
              onTogglePause={() => setPaused((value) => !value)}
              speed={speed}
              onSpeedChange={setSpeed}
              zoom={zoom}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onReset={resetView}
              canZoomIn={zoom < ZOOM_MAX - 0.001}
              canZoomOut={zoom > ZOOM_MIN + 0.001}
              selectedId={selectedId}
              onSelect={selectPlanet}
            />
          </div>
        </section>

        <aside
          className={`explorer__panel${selectedPlanet ? ' has-selection' : ''}`}
          aria-label="Planet information"
          data-lg="panel"
        >
          <div className="explorer__panel-scroll" ref={panelRef}>
            <PlanetPanel
              planet={selectedPlanet}
              onClear={() => selectPlanet(null)}
              onSelect={(id) => selectPlanet(id)}
            />
          </div>
        </aside>
      </div>

      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
