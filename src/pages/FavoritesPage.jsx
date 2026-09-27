import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import PandalCard from '../components/PandalCard';
import pandals from '../data/pandals.json';
import { shareContent } from '../utils/geo';

export default function FavoritesPage() {
  const { favorites, addMultipleFavorites } = useFavorites();
  const [searchParams] = useSearchParams();
  const [toastMessage, setToastMessage] = useState('');

  // Check if URL has ?ids=id1,id2,id3 parameter (Shared Circuit mode)
  const sharedIdsParam = searchParams.get('ids');
  const sharedIds = sharedIdsParam ? sharedIdsParam.split(',').map(s => s.trim()).filter(Boolean) : null;
  const isSharedView = Boolean(sharedIds && sharedIds.length > 0);

  // If shared view, display pandals matching sharedIds; otherwise display user's own saved favorites
  const displayedPandals = isSharedView
    ? pandals.filter(p => sharedIds.includes(p.id))
    : pandals.filter(p => favorites.includes(p.id));

  const handleShareCircuit = async () => {
    if (displayedPandals.length === 0) return;

    const idsStr = displayedPandals.map(p => p.id).join(',');
    const namesList = displayedPandals.map((p, idx) => `${idx + 1}. ${p.name} (${p.suburb})`).join('\n');
    const shareUrl = `${window.location.origin}${window.location.pathname}#/favorites?ids=${idsStr}`;

    const shareText = `🪔 My Mumbai Durga Puja 2026 Circuit 🪔\n\n${namesList}\n\nExplore this custom circuit here:`;

    const res = await shareContent({
      title: 'My Durga Puja 2026 Circuit',
      text: shareText,
      url: shareUrl
    });

    if (res.success && res.method === 'clipboard') {
      setToastMessage('Shared circuit link copied!');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const getWhatsAppShareUrl = () => {
    const idsStr = displayedPandals.map(p => p.id).join(',');
    const shareUrl = encodeURIComponent(`${window.location.origin}${window.location.pathname}#/favorites?ids=${idsStr}`);
    const namesList = displayedPandals.map((p, idx) => `${idx + 1}. ${p.name} (${p.suburb})`).join('%0A');
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

        {/* Shared Circuit Banner */}
        {isSharedView && (
          <div style={{
            background: 'rgba(234, 88, 12, 0.08)',
            border: '1px solid rgba(234, 88, 12, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justify: 'space-between',
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
                You are viewing a custom Durga Puja circuit shared with you.
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

        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="text-label">{isSharedView ? 'Shared Circuit' : 'My Circuit'}</div>
            <h1 className="text-display" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--sindoor)' }}>
              {isSharedView ? 'Shared Pandals' : 'Saved Pandals'}
            </h1>
            <p className="text-muted">
              {isSharedView
                ? `Custom circuit containing ${displayedPandals.length} pandal${displayedPandals.length !== 1 ? 's' : ''}.`
                : `Your personalized pandal hopping circuit (${displayedPandals.length} saved).`}
            </p>
          </div>

          {displayedPandals.length > 0 && (
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

        {displayedPandals.length > 0 ? (
          <div className="cards-grid">
            {displayedPandals.map((pandal) => (
              <PandalCard key={pandal.id} pandal={pandal} />
            ))}
          </div>
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
