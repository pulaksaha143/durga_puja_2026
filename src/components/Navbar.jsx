import { Link, useLocation } from 'react-router-dom';
import TithiTicker from './TithiTicker';

export default function Navbar() {
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
        </div>

        {/* Live Tithi & Puja Schedule Moving Marquee */}
        <TithiTicker />
      </header>
    </>
  );
}
