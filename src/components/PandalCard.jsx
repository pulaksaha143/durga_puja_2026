import { Link } from 'react-router-dom';

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

export default function PandalCard({ pandal }) {
  return (
    <div className="pandal-card">
      <div className="card-header">
        <div className="card-badges">
          <span className="badge badge-zone">
            {pandal.suburb}, {pandal.zone}
          </span>
          <span className="badge badge-year">
            Est. {pandal.establishedYear}
          </span>
        </div>
        <h3 className="card-name">{pandal.name}</h3>
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
          {pandal.transit?.metro && (
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
