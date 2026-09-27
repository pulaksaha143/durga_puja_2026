import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { shareContent, formatDistance } from '../utils/geo';

const getTransitColor = (line) => {
  if (!line) return null;
  const l = line.toLowerCase();
  if (l.includes('western')) return 'var(--transit-wr)';
  if (l.includes('central') || l.includes('harbour')) return 'var(--transit-cr)';
  if (l.includes('line 1') || l.includes('blue')) return 'var(--transit-m1)';
  if (l.includes('line 2a') || l.includes('yellow')) return 'var(--transit-m2a)';
  if (l.includes('line 7') || l.includes('red')) return 'var(--transit-m7)';
  if (l.includes('line 3') || l.includes('aqua')) return 'var(--transit-m3)';
  return 'var(--text-dim)';
};

export default function PandalCard({ pandal, distance }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(pandal.id);
  const [toastMessage, setToastMessage] = useState('');

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Hash routing aware URL
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}#/pandal/${pandal.id}`;

    const res = await shareContent({
      title: pandal.name,
      text: `Check out ${pandal.name} (${pandal.suburb}) for Mumbai Durga Puja 2026! 🪔\nLocation & Details:`,
      url: shareUrl
    });

    if (res.success && res.method === 'clipboard') {
      setToastMessage('Link copied!');
      setTimeout(() => setToastMessage(''), 2500);
    }
  };

  return (
    <div className="pandal-card" style={{ position: 'relative' }}>
      {toastMessage && (
        <div style={{
          position: 'absolute',
          top: '0.75rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--marigold)',
          color: '#fff',
          padding: '0.25rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 600,
          zIndex: 10,
          boxShadow: 'var(--shadow-sm)'
        }}>
          {toastMessage}
        </div>
      )}

      <div className="card-header">
        {/* Top bar: Suburb tag + Est year on Left | Action icons on Right */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', minWidth: 0 }}>
            <span className="badge badge-zone">
              {pandal.suburb}
            </span>
            <span className="badge badge-year">
              Est. {pandal.establishedYear}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
            {/* Share Button */}
            <button
              onClick={handleShare}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-dim)',
                padding: '0.3rem',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '50%'
              }}
              title="Share Pandal"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                share
              </span>
            </button>

            {/* Favorite Button */}
            <button 
              onClick={(e) => { e.preventDefault(); toggleFavorite(pandal.id); }}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                color: favorite ? 'var(--sindoor)' : 'var(--text-dim)',
                padding: '0.3rem',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '50%'
              }}
              title={favorite ? 'Remove from My Circuit' : 'Add to My Circuit'}
            >
              <span className={`material-symbols-outlined ${favorite ? 'filled' : ''}`} style={{ fontVariationSettings: favorite ? "'FILL' 1" : "'FILL' 0", fontSize: '1.35rem' }}>
                favorite
              </span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="card-name" style={{ marginTop: '0.6rem', marginBottom: distance ? '0.35rem' : '0' }}>{pandal.name}</h3>

        {/* Near Me Distance Badge (Clean dedicated line below title) */}
        {distance !== undefined && distance !== null && (
          <div style={{ marginTop: '0.25rem' }}>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
              📍 {formatDistance(distance)} (by road)
            </span>
          </div>
        )}
      </div>

      <div className="card-body">
        <p className="card-highlight">{pandal.highlights}</p>
      </div>

      <div className="card-footer">
        <div className="transit-icons">
          {pandal.transit?.localTrain && (
            <div 
              className="transit-icon" 
              title={`${pandal.transit.localTrain.station} (${pandal.transit.localTrain.line})`}
              style={{ color: getTransitColor(pandal.transit.localTrain.line) }}
            >
              <span className="material-symbols-outlined">train</span>
            </div>
          )}
          {pandal.transit?.metro && pandal.transit.metro.nearestStation !== 'None' && pandal.transit.metro.nearestStation !== 'N/A' && (
            <div 
              className="transit-icon" 
              title={`${pandal.transit.metro.nearestStation} (${pandal.transit.metro.line})`}
              style={{ color: getTransitColor(pandal.transit.metro.line) }}
            >
              <span className="material-symbols-outlined">subway</span>
            </div>
          )}
          {pandal.transit?.road && (
            <div className="transit-icon" title="By Road">
              <span className="material-symbols-outlined">directions_car</span>
            </div>
          )}
        </div>

        <Link to={`/pandal/${pandal.id}`} className="btn-details">
          View Details
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
