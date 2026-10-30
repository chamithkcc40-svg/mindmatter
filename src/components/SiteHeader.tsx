import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Wordmark } from './Wordmark';
import { ArrowRight, Close, Menu } from './icons';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Explore', to: '/explore' },
  { label: 'Science Library', to: '/science-library' },
  { label: 'About', to: '/about' },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  // Solid header after the first scroll — transparent while resting on the hero.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Lock the page, trap escape, and restore focus while the menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.classList.add('is-locked');

    const focusables = () =>
      Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        ) ?? [],
      );

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const timer = window.setTimeout(() => focusables()[0]?.focus(), 80);

    return () => {
      document.body.classList.remove('is-locked');
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timer);
      previouslyFocused?.focus?.();
    };
  }, [menuOpen]);

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div
        className="shell site-header__inner"
        data-lg="bar"
        data-lg-layer="chrome"
        data-lg-radius="999"
      >
        <Link to="/" className="site-header__brand" aria-label="Mind Matter — home">
          <Wordmark size={30} />
        </Link>

        <nav className="site-nav" aria-label="Primary">
          <ul className="site-nav__list">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `site-nav__link${isActive ? ' is-active' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive ? (
                        <span
                          className="site-nav__bead"
                          data-lg="chip"
                          data-lg-layer="chrome"
                          aria-hidden="true"
                        />
                      ) : null}
                      <span className="site-nav__label">{link.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <Link
            className="btn btn--primary site-header__cta"
            to="/explore/solar-system"
            data-lg="primary"
            data-lg-layer="chrome"
          >
            Explore Solar System
            <ArrowRight className="btn__icon" />
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="site-header__toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
            data-lg="button"
            data-lg-layer="chrome"
          >
            {menuOpen ? <Close width={20} height={20} /> : <Menu width={20} height={20} />}
            <span className="visually-hidden">
              {menuOpen ? 'Close menu' : 'Open menu'}
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        ref={menuRef}
        className={`mobile-menu${menuOpen ? ' is-open' : ''}`}
        hidden={!menuOpen}
        data-lg="sheet"
        data-lg-layer="chrome"
        data-lg-radius="26"
      >
        <nav aria-label="Mobile">
          <ul className="mobile-menu__list">
            {NAV_LINKS.map((link, index) => (
              <li key={link.to} style={{ '--i': index } as React.CSSProperties}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `mobile-menu__link${isActive ? ' is-active' : ''}`
                  }
                >
                  <span>{link.label}</span>
                  <ArrowRight width={18} height={18} />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          className="btn btn--primary mobile-menu__cta"
          to="/explore/solar-system"
          data-lg="primary"
          data-lg-layer="chrome"
        >
          Explore Solar System
          <ArrowRight className="btn__icon" />
        </Link>
        <p className="mobile-menu__note">
          An interactive science studio. Everything here is built to be explored,
          not just read.
        </p>
      </div>
    </header>
  );
}
