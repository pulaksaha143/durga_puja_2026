import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="navbar-brand">
            <span className="material-symbols-outlined">temple_hindu</span>
            <span>মুম্বই দুর্গাপূজা ২০২৬</span>
          </Link>

          <nav className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Directory
            </Link>
            <Link to="/schedule" className={`nav-link ${isActive('/schedule') ? 'active' : ''}`}>
              Puja Schedule
            </Link>
            <Link to="/circuits" className={`nav-link ${isActive('/circuits') ? 'active' : ''}`}>
              Zone Map
            </Link>
            <Link to="/favorites" className={`nav-link ${isActive('/favorites') ? 'active' : ''}`}>
              My Circuit
            </Link>
          </nav>

          <div className="nav-actions">
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
        <button className="mobile-nav-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <span className="material-symbols-outlined">close</span>
        </button>
        <Link to="/" onClick={() => setMobileOpen(false)}>Pandal Directory</Link>
        <Link to="/schedule" onClick={() => setMobileOpen(false)}>Puja Schedule</Link>
        <Link to="/circuits" onClick={() => setMobileOpen(false)}>Zone Map</Link>
        <Link to="/favorites" onClick={() => setMobileOpen(false)}>My Circuit</Link>
      </div>
    </>
  );
}
