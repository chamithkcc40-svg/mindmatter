import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { SiteHeader } from './components/SiteHeader';
import { SiteFooter } from './components/SiteFooter';
import { CursorLight } from './components/CursorLight';
import { LiquidGlassLayer } from './liquid-glass';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { SolarSystemPage } from './pages/SolarSystemPage';
import { ScienceLibraryPage } from './pages/ScienceLibraryPage';
import { AboutPage } from './pages/AboutPage';
import { NotFoundPage } from './pages/NotFoundPage';

/** Restores scroll position on navigation, honouring in-page anchors. */
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}

export function App() {
  const location = useLocation();
  const isExplorer = location.pathname.startsWith('/explore/solar-system');

  return (
    <div className={`app${isExplorer ? ' app--explorer' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {/* WebGL2 liquid glass: the living backdrop, then the page chrome. */}
      <LiquidGlassLayer layer="base" mode="backdrop" />
      <LiquidGlassLayer layer="chrome" mode="overlay" />

      <CursorLight />
      <div className="noise-overlay" aria-hidden="true" />
      <ScrollManager />
      <SiteHeader />

      <main id="main" tabIndex={-1}>
        <div key={location.pathname} className="route-enter">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/explore/solar-system" element={<SolarSystemPage />} />
            <Route path="/science-library" element={<ScienceLibraryPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
