import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/') ? "'FILL' 1" : "'FILL' 0" }}>
          home
        </span>
        <span>Home</span>
      </Link>
      <Link to="/schedule" className={`bottom-nav-item ${isActive('/schedule') ? 'active' : ''}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/schedule') ? "'FILL' 1" : "'FILL' 0" }}>
          calendar_month
        </span>
        <span>Schedule</span>
      </Link>
      <Link to="/circuits" className={`bottom-nav-item ${isActive('/circuits') ? 'active' : ''}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/circuits') ? "'FILL' 1" : "'FILL' 0" }}>
          map
        </span>
        <span>Zone</span>
      </Link>
      <Link to="/favorites" className={`bottom-nav-item ${isActive('/favorites') ? 'active' : ''}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/favorites') ? "'FILL' 1" : "'FILL' 0" }}>
          favorite
        </span>
        <span>My Circuit</span>
      </Link>
    </nav>
  );
}
