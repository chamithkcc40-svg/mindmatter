import { PLANETS, type PlanetId } from '../../data/planets';
import { Minus, Pause, Play, Plus, Reset } from '../../components/icons';

interface SimulationControlsProps {
  paused: boolean;
  onTogglePause: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  selectedId: PlanetId | null;
  onSelect: (id: PlanetId | null) => void;
}

const SPEED_MIN = 0.25;
const SPEED_MAX = 4;

function formatSpeed(speed: number): string {
  return Number.isInteger(speed) ? String(speed) : String(Number(speed.toFixed(2)));
}

export function SimulationControls({
  paused,
  onTogglePause,
  speed,
  onSpeedChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  canZoomIn,
  canZoomOut,
  selectedId,
  onSelect,
}: SimulationControlsProps) {
  return (
    <div className="sim-controls" role="group" aria-label="Simulation controls">
      <div className="sim-controls__cluster">
        <button
          type="button"
          className="sim-btn sim-btn--primary"
          onClick={onTogglePause}
          aria-pressed={paused}
        >
          {paused ? <Play width={16} height={16} /> : <Pause width={16} height={16} />}
          <span>{paused ? 'Play' : 'Pause'}</span>
        </button>

        <div className="sim-controls__speed">
          <label htmlFor="sim-speed">
            Speed
            <output htmlFor="sim-speed" aria-live="off">
              {formatSpeed(speed)}×
            </output>
          </label>
          <input
            id="sim-speed"
            type="range"
            min={SPEED_MIN}
            max={SPEED_MAX}
            step={0.25}
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
            aria-valuetext={`${formatSpeed(speed)} times speed`}
          />
        </div>
      </div>

      <div className="sim-controls__cluster sim-controls__cluster--right">
        <div className="sim-controls__zoom" role="group" aria-label="Zoom">
          <button
            type="button"
            className="sim-btn sim-btn--icon"
            onClick={onZoomOut}
            disabled={!canZoomOut}
            aria-label="Zoom out"
          >
            <Minus width={16} height={16} />
          </button>
          <span className="sim-controls__zoom-value" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="sim-btn sim-btn--icon"
            onClick={onZoomIn}
            disabled={!canZoomIn}
            aria-label="Zoom in"
          >
            <Plus width={16} height={16} />
          </button>
        </div>

        <button type="button" className="sim-btn" onClick={onReset}>
          <Reset width={16} height={16} />
          <span>Reset view</span>
        </button>
      </div>

      <div className="sim-controls__rail" role="group" aria-label="Select a planet">
        <button
          type="button"
          className={`planet-chip${selectedId === null ? ' is-active' : ''}`}
          onClick={() => onSelect(null)}
          aria-pressed={selectedId === null}
        >
          <span className="planet-chip__sun" aria-hidden="true" />
          Full system
        </button>
        {PLANETS.map((planet) => (
          <button
            key={planet.id}
            type="button"
            className={`planet-chip${selectedId === planet.id ? ' is-active' : ''}`}
            onClick={() => onSelect(planet.id)}
            aria-pressed={selectedId === planet.id}
          >
            <span
              className="planet-chip__dot"
              aria-hidden="true"
              style={{
                background: `radial-gradient(circle at 32% 30%, ${planet.palette.light}, ${planet.palette.base} 60%, ${planet.palette.dark})`,
                boxShadow: `0 0 8px ${planet.palette.glow}`,
              }}
            />
            {planet.name}
          </button>
        ))}
      </div>
    </div>
  );
}
