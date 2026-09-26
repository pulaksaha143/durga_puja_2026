import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import pandals from '../data/pandals.json';

const circuitDefinitions = [
  {
    id: 'south-mumbai',
    title: 'South Mumbai & Dadar',
    description: 'Experience the oldest and most heritage-rich pandals of the city.',
    color: '#8B5CF6', 
    estimatedTime: '4-5 Hours',
    zones: ['South Mumbai', 'South Mumbai / Dadar']
  },
  {
    id: 'western-suburbs',
    title: 'Western Suburbs Circuit',
    description: 'The glitz and glamour of Bollywood-patronized pujas and massive eco-friendly idols.',
    color: 'var(--transit-wr)', 
    estimatedTime: '6-8 Hours',
    zones: ['Western Suburbs']
  },
  {
    id: 'central-suburbs',
    title: 'Central Suburbs Circuit',
    description: 'Deeply traditional rituals and architectural marvels stretching from Sion to Mulund.',
    color: 'var(--sindoor)',
    estimatedTime: '5-7 Hours',
    zones: ['Central Suburbs']
  },
  {
    id: 'thane-kalyan',
    title: 'Thane & Kalyan Route',
    description: 'Discover the rich community spirit and cultural heritage of the Thane and Kalyan belt.',
    color: 'var(--marigold)',
    estimatedTime: '5-6 Hours',
    zones: ['Thane District']
  },
  {
    id: 'navi-mumbai',
    title: 'Navi Mumbai Corridor',
    description: 'Explore the spectacular and expansive pandals across the planned city of Navi Mumbai.',
    color: 'var(--alpona)',
    estimatedTime: '5-6 Hours',
    zones: ['Navi Mumbai']
  },
  {
    id: 'palghar-extended',
    title: 'Palghar & Extended Circuit',
    description: 'The grand gatherings of the extended western belt and Palghar district.',
    color: '#10B981',
    estimatedTime: '4-6 Hours',
    zones: ['Palghar District']
  }
];

export default function CircuitsPage() {
  const [activeCircuitId, setActiveCircuitId] = useState(null);

  // Generate the circuits dynamically with ALL pandals
  const circuits = useMemo(() => {
    return circuitDefinitions.map(def => {
      const stops = pandals.filter(p => def.zones.includes(p.zone));
      return { ...def, stops };
    });
  }, []);

  const activeCircuit = circuits.find(c => c.id === activeCircuitId);

  return (
    <div className="page-enter">
      <div className="container" style={{ padding: '2rem 0 5rem', maxWidth: activeCircuit ? '800px' : '1600px', width: '95%', transition: 'max-width 0.3s ease' }}>
        
        {/* Header */}
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="text-display" style={{ color: 'var(--sindoor)', marginBottom: '1rem', fontSize: 'clamp(2.25rem, 6vw, 4rem)', fontWeight: 800 }}>
            {activeCircuit ? activeCircuit.title : 'Pandal Hopper Circuits'}
          </h1>
          <p style={{ color: 'var(--text-charcoal)', fontSize: '1.25rem', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
            {activeCircuit 
              ? activeCircuit.description 
              : "Curated transit-style routes connecting 50+ of Mumbai's most iconic pandals. Select a zone to view its map."}
          </p>
          {activeCircuit && (
            <button 
              onClick={() => setActiveCircuitId(null)}
              className="btn-secondary" 
              style={{ marginTop: '2rem', display: 'inline-flex' }}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to All Circuits
            </button>
          )}
        </div>

        {/* State 1: Grid of Circuit Cards */}
        {!activeCircuit && (
          <div className="circuits-grid" style={{ display: 'grid', gap: '2rem' }}>
            {circuits.map(circuit => (
              <button 
                key={circuit.id} 
                onClick={() => setActiveCircuitId(circuit.id)}
                style={{ 
                  background: 'var(--bg-surface)', padding: '2rem', borderRadius: 'var(--radius-xl)', 
                  border: `2px solid ${circuit.color}30`, boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
                  textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', width: '100%',
                  display: 'flex', flexDirection: 'column', height: '100%'
                }}
                className="circuit-hover-card"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="circuit-badge" style={{ backgroundColor: circuit.color, width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-lg)', boxShadow: `0 4px 12px ${circuit.color}40`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.75rem' }}>directions_transit</span>
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-charcoal)', marginBottom: '0.375rem', lineHeight: 1.15 }}>{circuit.title}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: circuit.color, fontWeight: 700, fontSize: '0.875rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>schedule</span>
                      {circuit.estimatedTime} &bull; {circuit.stops.length} Pandals
                    </div>
                  </div>
                </div>
                <p style={{ color: 'var(--text-ash)', fontSize: '1rem', lineHeight: 1.6, margin: 0, flexGrow: 1 }}>{circuit.description}</p>
                <div style={{ marginTop: '1.5rem', color: circuit.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                  Explore Route <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* State 2: Active Circuit Timeline */}
        {activeCircuit && (
          <div className="circuit-timeline">
            <div className="circuit-line" style={{ backgroundColor: activeCircuit.color }}></div>
            
            {activeCircuit.stops.map((pandal, index) => {
              return (
                <div key={pandal.id} className="circuit-stop">
                  <div className="circuit-node" style={{ borderColor: activeCircuit.color }}>
                    <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: activeCircuit.color, margin: 'auto' }}></div>
                  </div>
                  
                  <Link to={`/pandal/${pandal.id}`} style={{ 
                    display: 'block', background: 'var(--bg-surface)', padding: '1.5rem', 
                    borderRadius: 'var(--radius-xl)', border: '1px solid var(--warm-sand)', 
                    textDecoration: 'none', transition: 'all 0.3s', boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
                  }} className="circuit-hover-card">
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-charcoal)', marginBottom: '0.5rem' }}>{pandal.name}</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-ash)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--sindoor)' }}>location_on</span>
                      {pandal.suburb}, {pandal.zone}
                    </div>
                    {pandal.highlights && (
                      <div style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: `${activeCircuit.color}10`, 
                        padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-md)', color: activeCircuit.color, 
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
