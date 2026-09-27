import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PandalCard from '../components/PandalCard';
import MapView from '../components/MapView';
import pandals from '../data/pandals.json';
import { fetchRoadDistances } from '../utils/geo';

// Extract unique zones dynamically and create filters
const uniqueZones = [...new Set(pandals.map(p => p.zone))].sort();

const FILTERS = [
  { key: 'all', label: 'All' },
  ...uniqueZones.map(zone => ({
    key: zone,
    label: zone.replace(' District', '')
  }))
];

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [userLocation, setUserLocation] = useState(null);
  const [roadDistances, setRoadDistances] = useState({});
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [nearMeActive, setNearMeActive] = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGetLocation = () => {
    // If Near Me is currently active, toggle it OFF cleanly and hide distances
    if (nearMeActive) {
      setNearMeActive(false);
      return;
    }

    // If location & road distances were already computed, re-activate immediately without extra API call
    if (userLocation && Object.keys(roadDistances).length > 0) {
      setNearMeActive(true);
      return;
    }

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserLocation(coords);

        // Calculate actual shortest road distances across all pandals in 1 optimized batch call
        const distancesMap = await fetchRoadDistances(coords.lat, coords.lng, pandals);
        setRoadDistances(distancesMap);

        setIsLocating(false);
        setNearMeActive(true);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please allow location access to use Near Me.');
        } else {
          setLocationError('Unable to retrieve your location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const filtered = useMemo(() => {
    let result = pandals.map(p => {
      // CRITICAL FIX: Only attach _distance if Near Me mode is currently ACTIVE
      const distance = nearMeActive && roadDistances[p.id] !== undefined ? roadDistances[p.id] : null;
      return { ...p, _distance: distance };
    });

    // Zone filter
    if (activeFilter !== 'all') {
      result = result.filter(p => p.zone === activeFilter);
    }

    // Search
    if (search.trim()) {
      const tokens = search.toLowerCase().split(/\s+/).filter(Boolean);
      const exactQ = search.toLowerCase().trim();

      const getStr = (val) => Array.isArray(val) ? val.join(' ') : (val || '');

      result = result.filter(p => {
        const searchableText = [
          p.name,
          p.suburb,
          p.zone,
          p.venue,
          p.organizer || '',
          getStr(p.highlights),
          getStr(p.awards)
        ].join(' ').toLowerCase();

        return tokens.every(token => searchableText.includes(token));
      });

      // Sort exact name matches to the top for better relevance
      result.sort((a, b) => {
        const aNameMatch = a.name.toLowerCase().includes(exactQ) ? 1 : 0;
        const bNameMatch = b.name.toLowerCase().includes(exactQ) ? 1 : 0;
        return bNameMatch - aNameMatch;
      });
    }

    // Near Me Sort - Sort by actual road distance when active
    if (nearMeActive) {
      result.sort((a, b) => {
        if (a._distance === null) return 1;
        if (b._distance === null) return -1;
        return a._distance - b._distance;
      });
    }

    return result;
  }, [search, activeFilter, nearMeActive, roadDistances]);

  const stats = useMemo(() => {
    const oldest = Math.min(...pandals.map(p => p.establishedYear));
    return {
      total: pandals.length,
      heritage: new Date().getFullYear() - oldest,
    };
  }, []);

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="hero">
        <div className="container hero-split">
          
          <div className="hero-text-column">
            <h1 className="text-display" style={{ color: 'var(--sindoor)', marginTop: 0, marginBottom: '0.75rem', fontWeight: 800 }}>
              Mumbai Durga Puja 2026
            </h1>
            <p className="hero-subtitle" style={{ color: 'var(--text-muted)', fontSize: '1.125rem', marginBottom: '2rem' }}>
              The ultimate digital guide to exploring 50+ iconic pandals.
            </p>
            
            <div style={{ 
              fontFamily: 'var(--font-display)', 
              color: 'var(--gold)', 
              fontSize: '1.125rem', 
              fontWeight: 500, 
              marginBottom: '3.5rem',
              lineHeight: 1.8,
              letterSpacing: '0.05em',
              position: 'relative',
              padding: '1.25rem 0',
              maxWidth: 'fit-content'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '1px', background: 'var(--gold)', opacity: 0.4 }}></div>
              दुर्गे स्मृता हरसि भीतिमशेषजनन्तोः<br/>
              स्वस्थैः स्मृता मतिमतीव शुभां ददासि।
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '1px', background: 'var(--gold)', opacity: 0.4 }}></div>
            </div>

            {/* Search */}
            <div className="search-container" style={{ margin: '0 0 1.5rem 0', width: '100%' }}>
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="Search pandals by name, area, or zone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span className="search-kbd">⌘K</span>
            </div>

            {/* Filter Chips */}
            <div className="filter-chips" style={{ justifyContent: 'flex-start' }}>
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  className={`chip ${activeFilter === f.key ? 'active' : ''}`}
                  onClick={() => setActiveFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hero-image-column">
            <img 
              src={`${import.meta.env.BASE_URL}hero-puja.png`} 
              alt="Maa Durga Illustration" 
              className="hero-image"
            />
          </div>

        </div>
      </section>

      <div className="container">

        {/* Section Header */}
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="text-label">Explore Pandals</div>
            <h2 className="text-headline" style={{ color: 'var(--text-primary)' }}>
              {activeFilter === 'all' ? 'All Pandals' : `${FILTERS.find(f => f.key === activeFilter)?.label || activeFilter} Pandals`}
            </h2>
            {search && (
              <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
              </p>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Near Me GPS Toggle Button */}
            <button
              onClick={handleGetLocation}
              disabled={isLocating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                background: nearMeActive ? 'rgba(16, 185, 129, 0.15)' : 'var(--glass-1)',
                color: nearMeActive ? '#059669' : 'var(--text-primary)',
                border: nearMeActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--glass-border)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Sort pandals by distance from your current location"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: nearMeActive ? '#059669' : 'var(--marigold)' }}>
                {isLocating ? 'sync' : nearMeActive ? 'my_location' : 'near_me'}
              </span>
              {isLocating ? 'Locating...' : nearMeActive ? 'Near Me (Active)' : 'Near Me'}
            </button>

            {/* Map/List Toggle */}
            <div style={{ display: 'flex', background: 'var(--glass-1)', borderRadius: 'var(--radius-full)', padding: '0.25rem', border: '1px solid var(--glass-border)' }}>
              <button 
                onClick={() => setViewMode('list')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
                  background: viewMode === 'list' ? 'var(--marigold)' : 'transparent',
                  color: viewMode === 'list' ? 'white' : 'var(--text-primary)',
                  border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>format_list_bulleted</span>
                List
              </button>
              <button 
                onClick={() => setViewMode('map')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
                  background: viewMode === 'map' ? 'var(--marigold)' : 'transparent',
                  color: viewMode === 'map' ? 'white' : 'var(--text-primary)',
                  border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>map</span>
                Map
              </button>
            </div>
          </div>
        </div>

        {locationError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#dc2626',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>info</span>
            {locationError}
          </div>
        )}

        {/* Content Display */}
        {filtered.length > 0 ? (
          viewMode === 'list' ? (
            <div className="cards-grid">
              {filtered.map(pandal => (
                <PandalCard key={pandal.id} pandal={pandal} distance={pandal._distance} />
              ))}
            </div>
          ) : (
            <MapView pandals={filtered} />
          )
        ) : (
          <div className="no-results">
            <span className="material-symbols-outlined">search_off</span>
            <p>No pandals found matching your search. Try a different term.</p>
          </div>
        )}

        {/* Quick Links */}
        <div className="section-header" style={{ marginTop: '2rem' }}>
          <div className="text-label">Explore More</div>
          <h2 className="text-headline" style={{ color: 'var(--text-primary)' }}>Quick Links</h2>
        </div>
        <div className="quick-links">
          <Link to="/schedule" className="quick-link-card">
            <div className="quick-link-icon">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
            <div>
              <div className="quick-link-title">Puja Schedule &amp; Panchang</div>
              <div className="quick-link-desc">Daily tithi timings, pushpanjali slots, sandhi puja, and Vijaya Dashami schedule.</div>
            </div>
          </Link>
          <Link to="/circuits" className="quick-link-card">
            <div className="quick-link-icon">
              <span className="material-symbols-outlined">map</span>
            </div>
            <div>
              <div className="quick-link-title">Pandal Hopper Circuits</div>
              <div className="quick-link-desc">Curated transit-style routes connecting major pandals across the suburbs.</div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
