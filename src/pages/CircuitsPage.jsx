import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import pandals from '../data/pandals.json';

const districtDefinitions = [
  {
    id: 'mumbai-city',
    title: 'Mumbai City',
    description: 'The oldest and most heritage-rich pandals in the heart of South Mumbai and Dadar.',
    color: '#8B5CF6',
    icon: 'account_balance',
    district: 'Mumbai City'
  },
  {
    id: 'mumbai-suburban',
    title: 'Mumbai Suburban',
    description: 'From Bandra to Dahisar and Sion to Mulund — the largest cluster of iconic pandals across the Western and Central suburbs.',
    color: 'var(--transit-wr)',
    icon: 'train',
    district: 'Mumbai Suburban'
  },
  {
    id: 'thane',
    title: 'Thane District',
    description: 'The vibrant Bengali communities of Thane City, Kalyan, Dombivli, Ambernath, and Badlapur.',
    color: 'var(--sindoor)',
    icon: 'location_city',
    district: 'Thane'
  },
  {
    id: 'navi-mumbai',
    title: 'Navi Mumbai',
    description: 'Spectacular mega-pandals from Vashi and Nerul to Kharghar and Panvel across the planned city.',
    color: 'var(--alpona)',
    icon: 'apartment',
    district: 'Navi Mumbai'
  },
  {
    id: 'palghar',
    title: 'Palghar District',
    description: 'The grand gatherings of the Vasai-Virar belt and the Boisar-Tarapur industrial corridor.',
    color: '#10B981',
    icon: 'forest',
    district: 'Palghar'
  }
];

export default function CircuitsPage() {
  const [activeDistrictId, setActiveDistrictId] = useState(null);

  const districts = useMemo(() => {
    return districtDefinitions.map(def => {
      const stops = pandals.filter(p => p.district === def.district);
      return { ...def, stops };
    });
  }, []);

  const activeDistrict = districts.find(d => d.id === activeDistrictId);

  return (
    <div className="page-enter">
      <div className="container" style={{ padding: '2rem 0 5rem', maxWidth: activeDistrict ? '800px' : '1600px', width: '95%', transition: 'max-width 0.3s ease' }}>
        
        {/* Header */}
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="text-display" style={{ color: 'var(--sindoor)', marginBottom: '1rem', fontSize: 'clamp(2.25rem, 6vw, 4rem)', fontWeight: 800 }}>
            {activeDistrict ? activeDistrict.title : 'Pandal Hopper Circuits'}
          </h1>
          <p style={{ color: 'var(--text-charcoal)', fontSize: '1.25rem', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
            {activeDistrict 
              ? activeDistrict.description 
              : "Curated district-wise routes connecting 55+ of Mumbai's most iconic pandals. Select a district to explore its pandals."}
          </p>
          {activeDistrict && (
            <button 
              onClick={() => setActiveDistrictId(null)}
              className="btn-secondary" 
              style={{ marginTop: '2rem', display: 'inline-flex' }}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to All Districts
            </button>
          )}
        </div>

        {/* State 1: Grid of District Cards */}
        {!activeDistrict && (
          <div className="circuits-grid" style={{ display: 'grid', gap: '2rem' }}>
            {districts.map(district => (
              <button 
                key={district.id} 
                onClick={() => setActiveDistrictId(district.id)}
                style={{ 
                  background: 'var(--bg-surface)', padding: '2rem', borderRadius: 'var(--radius-xl)', 
                  border: `2px solid ${district.color}30`, boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
                  textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', width: '100%',
                  display: 'flex', flexDirection: 'column', height: '100%'
                }}
                className="circuit-hover-card"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="circuit-badge" style={{ backgroundColor: district.color, width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-lg)', boxShadow: `0 4px 12px ${district.color}40`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.75rem' }}>{district.icon}</span>
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '0.375rem', lineHeight: 1.15 }}>{district.title}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: district.color, fontWeight: 700, fontSize: '0.875rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>temple_hindu</span>
                      {district.stops.length} Pandals
                    </div>
                  </div>
                </div>
                <p style={{ color: 'var(--text-ash)', fontSize: '1rem', lineHeight: 1.6, margin: 0, flexGrow: 1 }}>{district.description}</p>
                <div style={{ marginTop: '1.5rem', color: district.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                  Explore District <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* State 2: Active District Timeline */}
        {activeDistrict && (
          <div className="circuit-timeline">
            <div className="circuit-line" style={{ backgroundColor: activeDistrict.color }}></div>
            
            {activeDistrict.stops.map((pandal, index) => {
              return (
                <div key={pandal.id} className="circuit-stop">
                  <div className="circuit-node" style={{ borderColor: activeDistrict.color }}>
                    <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: activeDistrict.color, margin: 'auto' }}></div>
                  </div>
                  
                  <Link to={`/pandal/${pandal.id}`} style={{ 
                    display: 'block', background: 'var(--bg-surface)', padding: '1.5rem', 
                    borderRadius: 'var(--radius-xl)', border: '1px solid var(--warm-sand)', 
                    textDecoration: 'none', transition: 'all 0.3s', boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
                  }} className="circuit-hover-card">
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '0.5rem' }}>{pandal.name}</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-ash)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--sindoor)' }}>location_on</span>
                      {pandal.suburb}
                    </div>
                    {pandal.highlights && (
                      <div style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: `${activeDistrict.color}10`, 
                        padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-md)', color: activeDistrict.color, 
                        fontSize: '0.875rem', fontWeight: 600 
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>star</span>
                        Highlights Available
                      </div>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
