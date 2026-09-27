import { useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { useUserLocation } from '../hooks/useUserLocation';
import PandalCard from '../components/PandalCard';
import CircuitMapView from '../components/CircuitMapView';
import pandals from '../data/pandals.json';
import { shareContent, getHaversineDistance, optimizePandalRoute } from '../utils/geo';

export default function FavoritesPage() {
  const { favorites, addMultipleFavorites } = useFavorites();
  const { userLocation, isLocating, requestLocation } = useUserLocation();
  const location = useLocation();
  const [toastMessage, setToastMessage] = useState('');
  const [isOptimized, setIsOptimized] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  const [customStartId, setCustomStartId] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'map'

  // Robust query string parser that works across HashRouter & GitHub Pages
  const { isSharedView, sharedPandals, sharedIds } = useMemo(() => {
    let queryStr = location.search;
    if (!queryStr && window.location.hash.includes('?')) {
      queryStr = '?' + window.location.hash.split('?')[1];
    }
    const params = new URLSearchParams(queryStr);

    const compactParam = params.get('c'); // e.g., "0,1,5" (compact index numbers)
    const idsParam = params.get('ids');   // e.g., "slug1,slug2" (backward compatibility)

    let matched = [];
    if (compactParam) {
      const indices = compactParam
        .split(',')
        .map(n => parseInt(n.trim(), 10))
        .filter(n => !isNaN(n) && n >= 0 && n < pandals.length);
      matched = indices.map(idx => pandals[idx]).filter(Boolean);
    } else if (idsParam) {
      const slugs = idsParam.split(',').map(s => s.trim()).filter(Boolean);
      matched = pandals.filter(p => slugs.includes(p.id));
    }

    return {
      isSharedView: matched.length > 0,
      sharedPandals: matched,
      sharedIds: matched.map(p => p.id)
    };
  }, [location.search, location.hash]);

  // Display shared circuit if URL has shared params; otherwise display user's own saved favorites
  const baseDisplayedPandals = isSharedView
    ? sharedPandals
    : pandals.filter(p => favorites.includes(p.id));

  // Request browser GPS to find closest pandal to the user
  const handleRequestGPS = () => {
    if (!navigator.geolocation) {
      setToastMessage('Geolocation is not supported by your browser.');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }
    requestLocation(
      (coords) => {
        setIsOptimized(true);
        setCustomStartId(null);
        setToastMessage('📍 GPS acquired! Route re-optimized starting nearest to you.');
        setTimeout(() => setToastMessage(''), 3500);
      },
      (err) => {
        setToastMessage('Could not access GPS. Using geographic optimal route.');
        setTimeout(() => setToastMessage(''), 3500);
      }
    );
  };

  // Intelligent Route Management: uses live GPS coordinates and mathematical TSP solver
  const optimizationResult = useMemo(() => {
    if (!isOptimized || baseDisplayedPandals.length <= 1) {
      return {
        orderedPandals: baseDisplayedPandals,
        strategy: 'default',
        startExplanation: '',
        userDistanceToStart: null
      };
    }
    const opt = optimizePandalRoute(baseDisplayedPandals, userLocation, customStartId);
    const ordered = isReversed ? [...opt.orderedPandals].reverse() : opt.orderedPandals;
    return {
      ...opt,
      orderedPandals: ordered
    };
  }, [baseDisplayedPandals, isOptimized, userLocation, customStartId, isReversed]);

  const displayedPandals = optimizationResult.orderedPandals;

  // Compute route metadata and leg distances
  const pandalsWithRouteMeta = useMemo(() => {
    return displayedPandals.map((pandal, idx) => {
      let legDist = 0;
      if (idx > 0) {
        const prev = displayedPandals[idx - 1];
        const rawDist = getHaversineDistance(
          prev.coordinates?.lat, prev.coordinates?.lng,
          pandal.coordinates?.lat, pandal.coordinates?.lng
        );
        // Estimate urban driving distance (approx 1.3x straight-line distance in Mumbai)
        legDist = rawDist !== null ? rawDist * 1.3 : 0;
      }
      return {
        pandal,
        routeMeta: {
          order: idx + 1,
          totalStops: displayedPandals.length,
          isFirst: idx === 0,
          isLast: idx === displayedPandals.length - 1 && displayedPandals.length > 1,
          legDist,
          prevPandal: idx > 0 ? displayedPandals[idx - 1] : null,
          nextPandal: idx < displayedPandals.length - 1 ? displayedPandals[idx + 1] : null,
          isOptimized
        }
      };
    });
  }, [displayedPandals, isOptimized]);

  // Total route driving distance
  const totalDistanceKm = useMemo(() => {
    let sum = 0;
    for (let i = 1; i < displayedPandals.length; i++) {
      const prev = displayedPandals[i - 1];
      const cur = displayedPandals[i];
      const rawDist = getHaversineDistance(
        prev.coordinates?.lat, prev.coordinates?.lng,
        cur.coordinates?.lat, cur.coordinates?.lng
      );
      if (rawDist !== null) {
        sum += rawDist * 1.3;
      }
    }
    return sum;
  }, [displayedPandals]);

  // Estimated driving time in Mumbai festive conditions (~3.5 min/km + stop buffers)
  const estimatedTravelMins = useMemo(() => {
    if (displayedPandals.length <= 1) return 0;
    return Math.max(5, Math.round(totalDistanceKm * 3.5 + (displayedPandals.length - 1) * 3));
  }, [totalDistanceKm, displayedPandals.length]);

  // Multi-stop turn-by-turn navigation in Google Maps (starts from user's live GPS if available)
  const googleMapsFullRouteUrl = useMemo(() => {
    if (displayedPandals.length === 0) return '';
    if (displayedPandals.length === 1) {
      const p = displayedPandals[0];
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + p.suburb + ' Mumbai')}`;
    }
    const origin = userLocation
      ? `${userLocation.lat},${userLocation.lng}`
      : `${displayedPandals[0].coordinates?.lat},${displayedPandals[0].coordinates?.lng}`;
    const destination = `${displayedPandals[displayedPandals.length - 1].coordinates?.lat},${displayedPandals[displayedPandals.length - 1].coordinates?.lng}`;
    
    // Intermediate waypoints
    const intermediate = userLocation
      ? displayedPandals.slice(0, -1)
      : displayedPandals.slice(1, -1);

    const waypoints = intermediate
      .filter(p => p.coordinates?.lat && p.coordinates?.lng)
      .map(p => `${p.coordinates.lat},${p.coordinates.lng}`)
      .join('|');

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }
    return url;
  }, [displayedPandals, userLocation]);

  // Scroll to a specific card smoothly from the stepper
  const scrollToPandal = (id) => {
    const el = document.getElementById(`pandal-node-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('pandal-card-flash');
      setTimeout(() => el.classList.remove('pandal-card-flash'), 1500);
    }
  };

  // Build ultra-compact share link using pandal array indices (e.g. ?c=0,1,5)
  const getShareUrl = () => {
    const indices = displayedPandals
      .map(p => pandals.findIndex(item => item.id === p.id))
      .filter(idx => idx !== -1);
    const compactStr = indices.join(',');
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?c=${compactStr}`;
  };

  const handleShareCircuit = async () => {
    if (displayedPandals.length === 0) return;

    const shareUrl = getShareUrl();
    const prefix = isOptimized ? 'Optimized Hopping Sequence' : 'Custom Circuit';
    const namesList = displayedPandals.map((p, idx) => `${isOptimized ? `Stop ${idx + 1}` : `${idx + 1}`}. ${p.name} (${p.suburb})`).join('\n');
    const shareText = `🪔 My Mumbai Durga Puja 2026 ${prefix} 🪔\n\n${namesList}\n\nExplore this custom circuit here:`;

    const res = await shareContent({
      title: 'My Durga Puja 2026 Circuit',
      text: shareText,
      url: shareUrl
    });

    if (res.success && res.method === 'clipboard') {
      setToastMessage('Short circuit link copied!');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const getWhatsAppShareUrl = () => {
    const shareUrl = encodeURIComponent(getShareUrl());
    const namesList = displayedPandals.map((p, idx) => `${isOptimized ? `Stop ${idx + 1}` : `${idx + 1}`}. ${p.name} (${p.suburb})`).join('%0A');
    const text = `🪔 *My Mumbai Durga Puja 2026 Circuit* 🪔%0A%0A${namesList}%0A%0AOpen this circuit on your phone:%0A${shareUrl}`;
    return `https://api.whatsapp.com/send?text=${text}`;
  };

  const handleImportCircuit = () => {
    if (sharedIds && sharedIds.length > 0) {
      addMultipleFavorites(sharedIds);
      setToastMessage(`Saved ${displayedPandals.length} pandal${displayedPandals.length > 1 ? 's' : ''} to My Circuit!`);
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const handleToggleOptimize = () => {
    if (!isOptimized) {
      setIsOptimized(true);
      // Auto-detect GPS if browser permission is already granted
      if (!userLocation && navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then(result => {
          if (result.state === 'granted') {
            handleRequestGPS();
          }
        }).catch(() => {});
      }
      setToastMessage('Route optimized! Follow stops 1 to ' + baseDisplayedPandals.length);
      setTimeout(() => setToastMessage(''), 3500);
    } else {
      setIsOptimized(false);
      setCustomStartId(null);
      setIsReversed(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="container" style={{ padding: '2rem 1rem' }}>
        {toastMessage && (
          <div style={{
            position: 'fixed',
            bottom: '5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--marigold)',
            color: '#fff',
            padding: '0.6rem 1.4rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.875rem',
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center',
            maxWidth: '90%'
          }}>
            {toastMessage}
          </div>
        )}

        {/* Shared Circuit Banner */}
        {isSharedView && (
          <div style={{
            background: 'rgba(234, 88, 12, 0.08)',
            border: '1px solid rgba(234, 88, 12, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--marigold)', fontWeight: 700, fontSize: '0.95rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>share</span>
                Shared Pandal Circuit
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                You are viewing a custom Durga Puja circuit shared with you ({displayedPandals.length} pandals).
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleImportCircuit}
                className="btn-primary"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>bookmark_add</span>
                Save to My Circuit
              </button>
              <Link
                to="/favorites"
                className="btn-secondary"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}
              >
                My Saved List
              </Link>
            </div>
          </div>
        )}

        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div className="text-label">{isSharedView ? 'Shared Circuit' : 'My Circuit'}</div>
            <h1 className="text-display" style={{ fontSize: 'clamp(1.85rem, 5vw, 2.5rem)', marginBottom: '0.5rem', color: 'var(--sindoor)' }}>
              {isSharedView ? 'Shared Pandals' : 'Saved Pandals'}
            </h1>
            <p className="text-muted">
              {isSharedView
                ? `Custom circuit containing ${displayedPandals.length} pandal${displayedPandals.length !== 1 ? 's' : ''}.`
                : `Your personalized pandal hopping circuit (${displayedPandals.length} saved).`}
            </p>
          </div>

          {displayedPandals.length > 0 && (
            <div className="favorites-actions-bar">
              <button
                onClick={handleToggleOptimize}
                className={`btn-${isOptimized ? 'primary' : 'secondary'} btn-optimize-main`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
                  {isOptimized ? 'task_alt' : 'route'}
                </span>
                {isOptimized ? 'Route Active' : 'Optimize Route'}
              </button>
              
              <div className="favorites-share-group">
                <button
                  onClick={handleShareCircuit}
                  className="btn-secondary btn-share-circuit"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>share</span>
                  Share Circuit
                </button>
                <a
                  href={getWhatsAppShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary btn-whatsapp-circuit"
                  style={{ background: '#25D366', borderColor: '#25D366' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>chat</span>
                  WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Sleek Minimal Route Summary Bar */}
        {isOptimized && displayedPandals.length > 0 && (
          <div className="minimal-route-bar">
            <div className="route-bar-left">
              <div className="route-bar-heading">
                <span className="material-symbols-outlined route-bar-icon">alt_route</span>
                <span>
                  <strong>1st Stop: {displayedPandals[0].name}</strong> ({displayedPandals[0].suburb})
                </span>
              </div>
              <div className="route-bar-sub">
                {displayedPandals.length} stops • ~{totalDistanceKm.toFixed(1)} km (~{estimatedTravelMins} mins)
                {userLocation && optimizationResult.userDistanceToStart && (
                  <span> • ~{optimizationResult.userDistanceToStart.toFixed(1)} km from your GPS</span>
                )}
              </div>
            </div>

            <div className="route-bar-right">
              {!userLocation && (
                <button
                  type="button"
                  onClick={handleRequestGPS}
                  className="btn-minimal-pill"
                  disabled={isLocating}
                  title="Optimize route starting from your GPS location"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>near_me</span>
                  {isLocating ? 'Locating...' : 'Use GPS'}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsReversed(!isReversed)}
                className="btn-minimal-pill"
                title="Reverse hopping sequence"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>swap_vert</span>
                Reverse
              </button>

              <button
                type="button"
                onClick={() => setViewMode(v => v === 'map' ? 'cards' : 'map')}
                className={`btn-minimal-pill ${viewMode === 'map' ? 'active' : ''}`}
                style={viewMode === 'map' ? { background: 'var(--sindoor)', color: '#fff', borderColor: 'var(--sindoor)' } : {}}
                title={viewMode === 'map' ? 'Switch to Card List' : 'View Interactive Route Map'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>
                  {viewMode === 'map' ? 'view_agenda' : 'map'}
                </span>
                {viewMode === 'map' ? 'Cards' : 'Route Map'}
              </button>

              <a
                href={googleMapsFullRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-minimal-maps"
                title="Open turn-by-turn route in Google Maps"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>directions</span>
                Maps ↗
              </a>
            </div>
          </div>
        )}

        {displayedPandals.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div className="circuit-view-switcher">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`circuit-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined">view_agenda</span>
                Cards ({displayedPandals.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`circuit-view-btn ${viewMode === 'map' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined">map</span>
                Route Map
              </button>
            </div>

            {viewMode === 'cards' && (
              <button
                type="button"
                onClick={() => setViewMode('map')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--sindoor)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.3rem 0.5rem'
                }}
              >
                <span>Preview Interactive Route Map</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
              </button>
            )}
          </div>
        )}

        {displayedPandals.length > 0 ? (
          <>
            {viewMode === 'map' && (
              <CircuitMapView
                pandals={displayedPandals}
                userLocation={userLocation}
                isOptimized={isOptimized}
                totalDistanceKm={totalDistanceKm}
                estimatedTravelMins={estimatedTravelMins}
                onSetStart={(id) => {
                  setCustomStartId(id);
                  setToastMessage('Starting stop updated!');
                  setTimeout(() => setToastMessage(''), 2500);
                }}
              />
            )}

            {viewMode === 'map' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
                  Stop-by-Stop Itinerary ({displayedPandals.length} stops)
                </h3>
              </div>
            )}

            <div className="cards-grid">
              {pandalsWithRouteMeta.map(({ pandal, routeMeta }) => (
                <PandalCard 
                  key={pandal.id} 
                  pandal={pandal} 
                  routeMeta={routeMeta} 
                />
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
              favorite_border
            </span>
            <h3 style={{ marginBottom: '1rem' }}>
              {isSharedView ? 'No matching pandals found' : 'No pandals saved yet!'}
            </h3>
            <p className="text-muted" style={{ marginBottom: '2rem' }}>
              {isSharedView
                ? 'The shared link did not contain valid pandal IDs.'
                : 'Browse the directory and tap the heart icon on any pandal card to build your custom circuit.'}
            </p>
            <Link to="/" className="btn-primary">
              <span className="material-symbols-outlined">explore</span>
              Explore Pandals
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
