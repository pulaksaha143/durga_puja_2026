import { useState } from 'react';
import { useFavorites } from '../hooks/useFavorites';
import PandalCard from '../components/PandalCard';
import pandals from '../data/pandals.json';
import { Link } from 'react-router-dom';
import { shareContent } from '../utils/geo';

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const [toastMessage, setToastMessage] = useState('');
  
  const favoritePandals = pandals.filter(p => favorites.includes(p.id));

  const handleShareCircuit = async () => {
    if (favoritePandals.length === 0) return;

    const namesList = favoritePandals.map((p, idx) => `${idx + 1}. ${p.name} (${p.suburb})`).join('\n');
    const shareText = `🪔 My Mumbai Durga Puja 2026 Circuit 🪔\n\n${namesList}\n\nExplore all 50+ pandals & schedules at:`;
    const shareUrl = window.location.origin + window.location.pathname + '#/favorites';

    const res = await shareContent({
      title: 'My Durga Puja 2026 Circuit',
      text: shareText,
      url: shareUrl
    });

    if (res.success && res.method === 'clipboard') {
      setToastMessage('Circuit copied to clipboard!');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const getWhatsAppShareUrl = () => {
    const namesList = favoritePandals.map((p, idx) => `${idx + 1}. ${p.name} (${p.suburb})`).join('%0A');
    const shareUrl = encodeURIComponent(window.location.origin + window.location.pathname + '#/favorites');
    const text = `🪔 *My Mumbai Durga Puja 2026 Circuit* 🪔%0A%0A${namesList}%0A%0AExplore pandals here: ${shareUrl}`;
    return `https://api.whatsapp.com/send?text=${text}`;
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
            padding: '0.5rem 1.25rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.875rem',
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: 'var(--shadow-md)'
          }}>
            {toastMessage}
          </div>
        )}

        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="text-label">My Circuit</div>
            <h1 className="text-display" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--sindoor)' }}>
              Saved Pandals
            </h1>
            <p className="text-muted">
              Your personalized pandal hopping circuit ({favoritePandals.length} saved).
            </p>
          </div>

          {favoritePandals.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleShareCircuit}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', fontSize: '0.875rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>share</span>
                Share Circuit
              </button>
              <a
                href={getWhatsAppShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', fontSize: '0.875rem', background: '#25D366', borderColor: '#25D366' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>chat</span>
                WhatsApp
              </a>
            </div>
          )}
        </div>

        {favoritePandals.length > 0 ? (
          <div className="cards-grid">
            {favoritePandals.map((pandal) => (
              <PandalCard key={pandal.id} pandal={pandal} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
              favorite_border
            </span>
            <h3 style={{ marginBottom: '1rem' }}>No pandals saved yet!</h3>
            <p className="text-muted" style={{ marginBottom: '2rem' }}>
              Browse the directory and tap the heart icon on any pandal card to build your custom circuit.
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
