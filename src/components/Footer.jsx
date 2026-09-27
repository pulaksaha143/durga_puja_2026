import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div>
            <div className="footer-brand">মুম্বই দুর্গাপূজা ২০২৬</div>
            <p className="footer-desc">
              Your complete guide to 50+ Durga Puja pandals across Mumbai, Thane &amp; Navi Mumbai. 
              Find pandal locations, transit routes, puja schedules, and detailed information to plan 
              your perfect pandal-hopping itinerary.
            </p>
          </div>
          <div>
            <div className="footer-links-title">Directory</div>
            <div className="footer-links">
              <Link to="/">All Pandals</Link>
              <Link to="/schedule">Puja Schedule</Link>
              <Link to="/circuits">Pandal Circuits</Link>
            </div>
          </div>
          <div>
            <div className="footer-links-title">Zones</div>
            <div className="footer-links">
              <Link to="/circuits">Western Suburbs</Link>
              <Link to="/circuits">Central Suburbs</Link>
              <Link to="/circuits">Thane & Kalyan</Link>
              <Link to="/circuits">Navi Mumbai</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-quote">আসছে বছর আবার হবে | শুভ শারদোৎসব ২০২৬</p>
          <p>Panchami to Dashami &bull; Built by Pulak Saha</p>
        </div>
      </div>
    </footer>
  );
}
