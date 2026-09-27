import { Link } from 'react-router-dom';
import timings from '../data/timings.json';


const data = timings.durgaPuja2026;
const schedule = data.schedule;

export default function SchedulePage() {
  return (
    <div className="page-enter">
      <div className="schedule-page container">
        {/* Header */}
        <div className="schedule-header" style={{ marginBottom: '3.5rem' }}>
          <h1 className="text-display" style={{ color: 'var(--gold)', marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 600 }}>
            পূজার সময়সূচী
          </h1>
          <div style={{ fontSize: '1rem', maxWidth: '600px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            <div style={{ color: 'var(--text-charcoal)', fontWeight: 600 }}>{data.panjikaSource.split(' / ')[0]}</div>
            <div style={{ color: 'var(--text-ash)' }}>Based on {data.panjikaSource.split(' / ')[1]}</div>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
            October 14–21, 2026 &bull; Panchami to Vijaya Dashami
          </p>
        </div>

        {/* Goddess Transit */}
        <div className="goddess-transit" style={{ marginBottom: '3rem' }}>
          <div className="goddess-card">
            <div className="goddess-card-label">
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '0.25rem' }}>
                login
              </span>
              Arrival (আগমন)
            </div>
            <div className="goddess-card-bengali">{data.goddessTransit.arrival.bengali}</div>
            <div className="goddess-card-english">{data.goddessTransit.arrival.english}</div>
          </div>
          <div className="goddess-card">
            <div className="goddess-card-label">
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '0.25rem' }}>
                logout
              </span>
              Departure (প্রস্থান)
            </div>
            <div className="goddess-card-bengali">{data.goddessTransit.departure.bengali}</div>
            <div className="goddess-card-english">{data.goddessTransit.departure.english}</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="timeline">
          {schedule.map((day, idx) => {
            const isHighlight = day.festivalDayEng.includes('Ashtami') || day.festivalDayEng.includes('Dashami');
            return (
              <div className="timeline-item" key={idx}>
                <div className={`timeline-node ${isHighlight ? 'highlight' : ''}`} />
                <div className="timeline-content">
                  <div className="timeline-day">{day.festivalDayEng}</div>
                  <div className="timeline-day-ben">{day.festivalDayBen}</div>
                  <div className="timeline-date">
                    <span>{day.tithiStart.englishDate}</span>
                    <span style={{ color: 'var(--marigold)' }}>•</span>
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
                        <div className="ritual-time">
                          <span className="material-symbols-outlined" style={{ fontSize: '0.75rem', verticalAlign: 'middle', marginRight: '0.25rem' }}>
                            schedule
                          </span>
                          {r.timeEng}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', marginTop: '0.125rem' }}>
                          {r.timeBen}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back to Directory */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link to="/" className="btn-primary">
            <span className="material-symbols-outlined">temple_hindu</span>
            Browse Pandal Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
