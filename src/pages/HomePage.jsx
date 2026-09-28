import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PandalCard from '../components/PandalCard';
import MapView from '../components/MapView';
import LocationBanner from '../components/LocationBanner';
import pandals from '../data/pandals.json';
import { fetchRoadDistances, getHaversineDistance } from '../utils/geo';
import { useUserLocation } from '../hooks/useUserLocation';

// Extract unique districts dynamically and create filters
const uniqueDistricts = [...new Set(pandals.map(p => p.district))].sort();

// Extract unique train lines
const uniqueTrainLines = [...new Set(pandals.map(p => p.transit?.localTrain?.line).filter(Boolean))].sort();

// Extract unique metro lines
const metroLinesSet = new Set();
pandals.forEach(p => {
  if (p.transit?.metro?.line) {
    p.transit.metro.line.split('&').forEach(l => metroLinesSet.add(l.trim()));
  }
});
const uniqueMetroLines = [...metroLinesSet].sort();

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ district: 'all', train: 'all', metro: 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [roadDistances, setRoadDistances] = useState({});
  const [nearMeActive, setNearMeActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Location hook — only fetches when user explicitly enables via banner or Near Me button
  const { userLocation, isLocating, isPermissionDenied, locationError, requestLocation } = useUserLocation();

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

  // Compute road distances when user location is available
  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng) {
      // 1. Immediately calculate fast estimates so UI instantly sorts closest-first without waiting
      const fastMap = {};
      pandals.forEach(p => {
        if (p.coordinates?.lat && p.coordinates?.lng) {
          const hav = getHaversineDistance(userLocation.lat, userLocation.lng, p.coordinates.lat, p.coordinates.lng);
          fastMap[p.id] = hav ? hav * 1.3 : null;
        }
      });
      setRoadDistances(fastMap);
      setNearMeActive(true);

      // 2. Refine with high-precision OSRM road network distances in the background
      fetchRoadDistances(userLocation.lat, userLocation.lng, pandals).then(distancesMap => {
        if (distancesMap && Object.keys(distancesMap).length > 0) {
          setRoadDistances(distancesMap);
        }
      });
    }
  }, [userLocation]);

  const handleToggleNearMe = () => {
    if (nearMeActive) {
      setNearMeActive(false);
      return;
    }

    if (userLocation) {
      setNearMeActive(true);
      return;
    }

    // User provides location later if not provided initially on homepage
    setToastMessage('📍 Requesting location from your browser...');
    requestLocation(
      (coords) => {
        setNearMeActive(true);
        setToastMessage('📍 Location enabled! Sorting closest pandals.');
        setTimeout(() => setToastMessage(''), 3500);
      },
      (err) => {
        setToastMessage('⚠️ Location permission was not granted.');
        setTimeout(() => setToastMessage(''), 3500);
      }
    );
  };

  const filtered = useMemo(() => {
    let result = pandals.map(p => {
      // CRITICAL FIX: Only attach _distance if Near Me mode is currently ACTIVE
      const distance = nearMeActive && roadDistances[p.id] !== undefined ? roadDistances[p.id] : null;
      return { ...p, _distance: distance };
    });

    // Filters
    if (filters.district !== 'all') {
      result = result.filter(p => p.district === filters.district);
    }
    if (filters.train !== 'all') {
      result = result.filter(p => p.transit?.localTrain?.line === filters.train);
    }
    if (filters.metro !== 'all') {
      result = result.filter(p => {
        if (!p.transit?.metro?.line) return false;
        const lines = p.transit.metro.line.split('&').map(l => l.trim());
        return lines.includes(filters.metro);
      });
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
  }, [search, filters, nearMeActive, roadDistances]);

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

            {/* Search and Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '640px', margin: '0 auto 1.5rem', position: 'relative', zIndex: 50 }}>
              <div className="search-container" style={{ margin: 0, flex: 1, position: 'relative' }}>
                <span className="material-symbols-outlined search-icon">search</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input"
                  placeholder="Search pandals..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <span className="search-kbd">⌘K</span>
              </div>
              
              <button 
                className={`filter-toggle-btn ${showFilters || Object.values(filters).some(v => v !== 'all') ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <span className="material-symbols-outlined">tune</span>
                <span className="filter-toggle-text">Filters</span>
                {Object.values(filters).filter(v => v !== 'all').length > 0 && (
                  <span className="filter-badge">{Object.values(filters).filter(v => v !== 'all').length}</span>
                )}
              </button>

              {/* Filter Dropdown/Modal */}
              {showFilters && (
                <div className="filter-dropdown">
                  <div className="filter-dropdown-header">
                    <h3>Filters</h3>
                    <button className="close-btn" onClick={() => setShowFilters(false)}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  
                  <div className="filter-group">
                    <label>District</label>
                    <select value={filters.district} onChange={e => setFilters({...filters, district: e.target.value})}>
                      <option value="all">All Districts</option>
                      {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Local Train Line</label>
                    <select value={filters.train} onChange={e => setFilters({...filters, train: e.target.value})}>
                      <option value="all">All Lines</option>
                      {uniqueTrainLines.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Metro Line</label>
                    <select value={filters.metro} onChange={e => setFilters({...filters, metro: e.target.value})}>
                      <option value="all">All Lines</option>
                      {uniqueMetroLines.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div className="filter-dropdown-footer">
                    <button 
                      className="btn-clear" 
                      onClick={() => setFilters({ district: 'all', train: 'all', metro: 'all' })}
                      disabled={Object.values(filters).every(v => v === 'all')}
                    >
                      Clear All
                    </button>
                    <button className="btn-apply" onClick={() => setShowFilters(false)}>
                      Apply
                    </button>
                  </div>
                </div>
              )}
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
              {filters.district === 'all' ? 'All Pandals' : `${filters.district} Pandals`}
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
              onClick={handleToggleNearMe}
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

        {/* Location Notice Banner for rejected / unprovided location with retry & unblock guide */}
        <LocationBanner onLocationEnabled={() => setNearMeActive(true)} />

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

        {/* Global Location Feedback Toast */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            bottom: '5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--marigold)',
            color: '#fff',
            padding: '0.65rem 1.4rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.875rem',
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.3s ease',
            whiteSpace: 'nowrap'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>near_me</span>
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
