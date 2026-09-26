import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PandalCard from '../components/PandalCard';
import Footer from '../components/Footer';
import pandals from '../data/pandals.json';

const ZONES = [
  { key: 'all', label: 'All' },
  { key: 'Western Suburbs', label: 'Western Suburbs' },
  { key: 'Central Suburbs', label: 'Central Suburbs' },
];

// Extract unique zones dynamically
const uniqueZones = [...new Set(pandals.map(p => p.zone))];

// Get suburb-based filters for Thane and Navi Mumbai
const thaneSuburbs = ['Thane West', 'Thane East', 'Kalyan West', 'Dombivli East'];
const naviMumbaiSuburbs = ['Vashi', 'Nerul East', 'Airoli', 'Seawoods', 'Panvel', 'Koparkhairane'];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'Western Suburbs', label: 'Western Suburbs' },
  { key: 'Central Suburbs', label: 'Central' },
  { key: 'thane', label: 'Thane & Kalyan' },
  { key: 'navi', label: 'Navi Mumbai' },
];

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
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

  const filtered = useMemo(() => {
    let result = pandals;

    // Zone filter
    if (activeFilter === 'thane') {
      result = result.filter(p => thaneSuburbs.includes(p.suburb));
    } else if (activeFilter === 'navi') {
      result = result.filter(p => naviMumbaiSuburbs.includes(p.suburb));
    } else if (activeFilter !== 'all') {
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

    return result;
  }, [search, activeFilter]);

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
              The ultimate digital guide to exploring {stats.total}+ iconic pandals.
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
              src="/hero-puja.png" 
              alt="Maa Durga Illustration" 
              style={{ 
                width: '100%', 
                maxWidth: '560px', 
                height: 'auto', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 20px 40px rgba(185, 28, 28, 0.15))',
                transform: 'translate(2.8rem, -2rem)'
              }}
            />
          </div>

        </div>
      </section>

      <div className="container">

        {/* Section Header */}
        <div className="section-header">
          <div className="text-label">Explore Pandals</div>
          <h2 className="text-headline" style={{ color: 'var(--text-primary)' }}>
            {activeFilter === 'all' ? 'All Pandals' : 
             activeFilter === 'thane' ? 'Thane & Kalyan Pandals' :
             activeFilter === 'navi' ? 'Navi Mumbai Pandals' :
             `${activeFilter} Pandals`}
          </h2>
          {search && (
            <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
            </p>
          )}
        </div>

        {/* Pandal Cards Grid */}
        {filtered.length > 0 ? (
          <div className="cards-grid">
            {filtered.map(pandal => (
              <PandalCard key={pandal.id} pandal={pandal} />
            ))}
          </div>
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
          <div className="quick-link-card">
            <div className="quick-link-icon">
              <span className="material-symbols-outlined">directions_transit</span>
            </div>
            <div>
              <div className="quick-link-title">Metro &amp; Transit Guide</div>
              <div className="quick-link-desc">Local train, Metro, BEST bus routes, and last-mile auto directions for every pandal.</div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
