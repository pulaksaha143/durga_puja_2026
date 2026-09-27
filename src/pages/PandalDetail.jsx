import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import pandals from '../data/pandals.json';
import timings from '../data/timings.json';
import PandalMapView from '../components/PandalMapView';
import { useUserLocation } from '../hooks/useUserLocation';
import { getHaversineDistance } from '../utils/geo';

const schedule = timings.durgaPuja2026.schedule;

const getTransitColor = (line) => {
  if (!line) return 'var(--gold)';
  const l = line.toLowerCase();
  if (l.includes('western')) return 'var(--transit-wr)';
  if (l.includes('central') || l.includes('harbour')) return 'var(--transit-cr)';
  if (l.includes('line 1') || l.includes('blue')) return 'var(--transit-m1)';
  if (l.includes('line 2a') || l.includes('yellow')) return 'var(--transit-m2a)';
  if (l.includes('line 7') || l.includes('red')) return 'var(--transit-m7)';
  if (l.includes('line 3') || l.includes('aqua')) return 'var(--transit-m3)';
  return 'var(--gold)';
};

export default function PandalDetail() {
  const { id } = useParams();
  const [mapLoaded, setMapLoaded] = useState(false);
  const { userLocation } = useUserLocation();
  const pandal = pandals.find(p => p.id === id);

  const pandalCoord = pandal?.coordinates;
  const distanceKm = (userLocation?.lat && userLocation?.lng && pandalCoord?.lat && pandalCoord?.lng)
    ? (getHaversineDistance(userLocation.lat, userLocation.lng, pandalCoord.lat, pandalCoord.lng) * 1.3)
    : null;

  if (!pandal) {
    return (
      <div className="container page-enter" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--text-dim)' }}>error</span>
        <h2 className="text-headline" style={{ color: 'var(--text-primary)', marginTop: '1rem' }}>Pandal Not Found</h2>
        <p style={{ color: 'var(--text-dim)', margin: '1rem 0' }}>The pandal you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary">
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="detail-page container">
        {/* Back Link */}
        <Link to="/" className="back-link">
          <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>arrow_back</span>
          Back to Directory
        </Link>

        {/* Hero */}
        <div className="detail-hero">
          <h1 className="detail-name">{pandal.name}</h1>
          <p className="detail-organizer">Organized by {pandal.organizer}</p>
          <div className="detail-badges">
            <span className="badge badge-zone" style={{ background: 'var(--bg-surface)', borderColor: 'var(--warm-sand)', color: 'var(--text-charcoal)' }}>{pandal.suburb}, {pandal.zone}</span>
            <span className="badge badge-year" style={{ background: 'var(--bg-surface)', borderColor: 'var(--warm-sand)', color: 'var(--text-charcoal)' }}>Est. {pandal.establishedYear}</span>
            <span className="badge badge-year" style={{ 
              background: 'rgba(234, 88, 12, 0.08)', 
              borderColor: 'rgba(234, 88, 12, 0.25)', 
              color: 'var(--marigold)' 
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>history</span>
              {new Date().getFullYear() - pandal.establishedYear} Years of Heritage
            </span>
            {distanceKm !== null && (
              <span className="badge" style={{ 
                background: 'rgba(16, 185, 129, 0.1)', 
                borderColor: 'rgba(16, 185, 129, 0.3)', 
                color: '#047857',
                fontWeight: 700
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#10B981' }}>near_me</span>
                ~{distanceKm.toFixed(1)} km from your location
              </span>
            )}
          </div>
          <div className="detail-highlights">
            {pandal.highlights}
          </div>
        </div>

        {/* Map Section */}
        <div className="map-section">
          <div className="section-header" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-charcoal)', fontWeight: 700, margin: 0 }}>
              Location Map
            </h2>
          </div>
          <PandalMapView pandal={pandal} />
          <p className="map-address">
            <span className="material-symbols-outlined">location_on</span>
            {pandal.venue}
          </p>
          {pandal.coordinates && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
              📍 {pandal.coordinates.lat}, {pandal.coordinates.lng}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {pandal.mapLink && (
              <a
                href={pandal.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <span className="material-symbols-outlined">directions</span>
                Open in Google Maps
              </a>
            )}
            <a
              href={userLocation?.lat && userLocation?.lng && pandal.coordinates?.lat && pandal.coordinates?.lng
                ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${pandal.coordinates.lat},${pandal.coordinates.lng}&travelmode=driving`
                : `https://www.google.com/maps/dir/?api=1&destination=${pandal.coordinates?.lat},${pandal.coordinates?.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <span className="material-symbols-outlined">navigation</span>
              Get Directions
            </a>
          </div>
        </div>

        {/* Transit Guide */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="section-header" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-charcoal)', fontWeight: 700, margin: 0 }}>
              Transit Guide
            </h2>
          </div>
          <div className="transit-grid">
            {/* Local Train */}
            {pandal.transit?.localTrain && (
              <div className="transit-card">
                <div className="transit-card-header">
                  <div className="transit-card-icon" style={{ borderColor: getTransitColor(pandal.transit.localTrain.line) + '40', background: getTransitColor(pandal.transit.localTrain.line) + '15' }}>
                    <span className="material-symbols-outlined" style={{ color: getTransitColor(pandal.transit.localTrain.line) }}>train</span>
                  </div>
                  <div className="transit-card-title">Local Train</div>
                </div>
                <div className="transit-detail">
                  <div className="transit-detail-label">Station</div>
                  <div className="transit-detail-value">{pandal.transit.localTrain.station}</div>
                </div>
                <div className="transit-detail">
                  <div className="transit-detail-label">Line</div>
                  <div className="transit-detail-value">{pandal.transit.localTrain.line}</div>
                </div>
                <div className="transit-detail">
                  <div className="transit-detail-label">Exit</div>
                  <div className="transit-detail-value">{pandal.transit.localTrain.exit}</div>
                </div>
                <div className="transit-detail">
                  <div className="transit-detail-label">Last Mile</div>
                  <div className="transit-detail-value">{pandal.transit.localTrain.lastMile}</div>
                </div>
              </div>
            )}

            {/* Metro */}
            {pandal.transit?.metro && pandal.transit.metro.nearestStation !== 'None' && pandal.transit.metro.nearestStation !== 'N/A' && (
              <div className="transit-card">
                <div className="transit-card-header">
                  <div className="transit-card-icon" style={{ borderColor: getTransitColor(pandal.transit.metro.line) + '40', background: getTransitColor(pandal.transit.metro.line) + '15' }}>
                    <span className="material-symbols-outlined" style={{ color: getTransitColor(pandal.transit.metro.line) }}>subway</span>
                  </div>
                  <div className="transit-card-title">Metro Rail</div>
                </div>
                <div className="transit-detail">
                  <div className="transit-detail-label">Nearest Station</div>
                  <div className="transit-detail-value">{pandal.transit.metro.nearestStation}</div>
                </div>
                <div className="transit-detail">
                  <div className="transit-detail-label">Line</div>
                  <div className="transit-detail-value">{pandal.transit.metro.line}</div>
                </div>
                <div className="transit-detail">
                  <div className="transit-detail-label">Last Mile</div>
                  <div className="transit-detail-value">{pandal.transit.metro.lastMile}</div>
                </div>
              </div>
            )}

            {/* Road */}
            {pandal.transit?.road && (
              <div className="transit-card">
                <div className="transit-card-header">
                  <div className="transit-card-icon">
                    <span className="material-symbols-outlined">directions_car</span>
                  </div>
                  <div className="transit-card-title">By Road</div>
                </div>
                <div className="transit-detail">
                  <div className="transit-detail-label">Route Advice</div>
                  <div className="transit-detail-value">{pandal.transit.road.routeAdvice}</div>
                </div>
                <div className="transit-detail">
                  <div className="transit-detail-label">Parking</div>
                  <div className="transit-detail-value">{pandal.transit.road.parking}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Puja Schedule */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="section-header" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <div className="text-label">পূজার সময়সূচী</div>
            <h2 className="text-title" style={{ color: 'var(--text-primary)' }}>Puja Schedule 2026</h2>
          </div>
          <div className="timeline">
            {schedule.map((day, idx) => (
              <div className="timeline-item" key={idx}>
                <div className={`timeline-node ${day.festivalDayEng.includes('Ashtami') || day.festivalDayEng.includes('Dashami') ? 'highlight' : ''}`} />
                <div className="timeline-content">
                  <div className="timeline-day">{day.festivalDayEng}</div>
                  <div className="timeline-day-ben">{day.festivalDayBen}</div>
                  <div className="timeline-date">
                    <span>{day.tithiStart.englishDate}</span>
                    <span style={{ color: 'var(--gold)', fontSize: '0.75rem' }}>•</span>
                    <span>{day.tithiStart.bengaliDate}</span>
                  </div>
                  {(() => {
                    const startParts = day.tithiStart.time.split(' / ');
                    const endParts = day.tithiEnd.time.split(' / ');
                    const startBen = startParts[0];
                    const startEng = startParts[1] || startParts[0];
                    const endBen = endParts[0];
                    const endEng = endParts[1] || endParts[0];

                    const startEngDate = day.tithiStart.englishDate.split('(')[0].trim();
                    const endEngDate = day.tithiEnd.englishDate.split('(')[0].trim();
                    const startBenDate = day.tithiStart.bengaliDate.split('(')[0].trim();
                    const endBenDate = day.tithiEnd.bengaliDate.split('(')[0].trim();

                    return (
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: 'var(--text-charcoal)', 
                        marginBottom: '1.25rem',
                        padding: '0.75rem 1rem',
                        background: 'rgba(185, 28, 28, 0.03)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(185, 28, 28, 0.1)',
                      }}>
                        <div style={{ marginBottom: '0.25rem' }}>
                          <strong style={{ color: 'var(--marigold)' }}>Tithi:</strong>{' '}
                          {startEngDate}, {startEng} → {endEngDate}, {endEng}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-ash)' }}>
                          <strong style={{ color: 'var(--marigold)', opacity: 0.85 }}>তিথি:</strong>{' '}
                          {startBenDate}, {startBen} → {endBenDate}, {endBen}
                        </div>
                      </div>
                    );
                  })()}
                  <ul className="timeline-rituals">
                    {day.ritualsAndTimings.map((r, ri) => (
                      <li className="timeline-ritual" key={ri}>
                        <div className="ritual-name">{r.eventEng}</div>
                        <div className="ritual-name-ben">{r.eventBen}</div>
                        <div className="ritual-time">{r.timeEng}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bar */}
      <div className="detail-sticky-bar">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${pandal.coordinates?.lat},${pandal.coordinates?.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          <span className="material-symbols-outlined">directions</span>
          Get Directions
        </a>
        <button
          className="btn-secondary"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: pandal.name,
                text: `Check out ${pandal.name} at ${pandal.venue}`,
                url: window.location.href,
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied!');
            }
          }}
        >
          <span className="material-symbols-outlined">share</span>
          Share
        </button>
      </div>
    </div>
  );
}
