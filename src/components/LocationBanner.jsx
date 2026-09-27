import React, { useState } from 'react';
import { useUserLocation } from '../hooks/useUserLocation';

export default function LocationBanner({ onLocationEnabled }) {
  const {
    userLocation,
    isLocating,
    isPermissionDenied,
    permissionState,
    bannerDismissed,
    requestLocation,
    setBannerDismissed
  } = useUserLocation();
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState('');

  // If user location is already active or banner was dismissed, hide entirely
  if (userLocation || bannerDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setBannerDismissed(true);
  };

  const handleOpenModal = () => {
    setModalError('');
    setShowModal(true);
  };

  const handleConfirmAllow = () => {
    setModalError('');
    requestLocation(
      (coords) => {
        // Success! Modal closes, banner auto-hides because userLocation becomes truthy
        setShowModal(false);
        if (onLocationEnabled) {
          try { onLocationEnabled(coords); } catch (e) {}
        }
      },
      (err) => {
        // Location failed — show clear error inside the modal
        if (err.code === 1) {
          // PERMISSION_DENIED — browser has blocked it
          setModalError('blocked');
        } else if (err.code === 3) {
          setModalError('Location request timed out. Please try again.');
        } else {
          setModalError('Could not get your location. Check your device GPS/network and try again.');
        }
      }
    );
  };

  // One-tap reset: clear all stored data and reload so the browser forgets the block
  const handleResetAndRetry = () => {
    try {
      localStorage.removeItem('mp_user_coords');
      sessionStorage.removeItem('mp_user_coords');
      sessionStorage.removeItem('mp_loc_banner_dismissed');
    } catch {}
    window.location.reload();
  };

  return (
    <>
      <div className="location-notice-card">
        <div className="location-notice-main">
          <div className="location-notice-icon-box">
            <span className="material-symbols-outlined location-notice-icon">
              {isPermissionDenied ? 'location_off' : 'my_location'}
            </span>
          </div>

          <div className="location-notice-body">
            <div className="location-notice-header">
              <h4 className="location-notice-title">
                {isPermissionDenied ? 'Location Access is Turned Off' : 'See Pandals Near You & On Maps'}
              </h4>
              <button 
                type="button" 
                onClick={handleDismiss} 
                className="location-notice-close-btn"
                title="Dismiss for this session"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>close</span>
              </button>
            </div>

            <p className="location-notice-text">
              {isPermissionDenied
                ? 'Your location is currently off. You can still search and view all 50+ pandals, or enable location to see closest pandals first and view your live green pin on maps.'
                : 'Enable location to see exact distances to each pandal, sort closest-first, and view your live green pin on maps across Mumbai.'}
            </p>

            <div className="location-notice-actions">
              <button
                type="button"
                onClick={handleOpenModal}
                className="btn-location-action primary"
                disabled={isLocating}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                  near_me
                </span>
                {isPermissionDenied ? 'Try Enabling Location' : 'Enable Location'}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="btn-location-action text-only"
              >
                Continue without location
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Location Permission Popup Modal */}
      {showModal && (
        <div className="location-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="location-modal-card" onClick={e => e.stopPropagation()}>
            <button 
              type="button" 
              onClick={() => setShowModal(false)}
              className="location-modal-close"
              title="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="location-modal-icon-wrap">
              <span className="material-symbols-outlined location-modal-icon">
                {modalError === 'blocked' ? 'location_off' : 'my_location'}
              </span>
            </div>

            {modalError === 'blocked' ? (
              <>
                {/* Permission is blocked by browser — guide user to reset */}
                <h3 className="location-modal-title">Location is Blocked</h3>

                <p className="location-modal-desc">
                  Your browser previously blocked location for this site. To fix this:
                </p>

                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  background: 'rgba(185, 28, 28, 0.06)',
                  borderRadius: '0.6rem',
                  padding: '0.7rem 0.85rem',
                  marginBottom: '1rem',
                  lineHeight: 1.55,
                  textAlign: 'left',
                  fontWeight: 500
                }}>
                  Tap the <strong>🔒 lock icon</strong> (or ⓘ icon) in your address bar → find <strong>Location</strong> → change to <strong>Allow</strong> → then reload this page.
                </p>

                <div className="location-modal-actions">
                  <button
                    type="button"
                    onClick={handleResetAndRetry}
                    className="btn-modal-allow"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>refresh</span>
                    Reload Page & Try Again
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setBannerDismissed(true); }}
                    className="btn-modal-cancel"
                  >
                    Continue without location
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Normal Allow/Don't Allow flow */}
                <h3 className="location-modal-title">Enable Location</h3>

                <p className="location-modal-desc">
                  Allow this website to access your location to show nearby pandals, distances, and your green pin on maps.
                </p>

                {modalError && (
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#DC2626',
                    background: 'rgba(220, 38, 38, 0.07)',
                    borderRadius: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    marginBottom: '1rem',
                    lineHeight: 1.45,
                    textAlign: 'left'
                  }}>
                    {modalError}
                  </p>
                )}

                <div className="location-modal-actions">
                  <button
                    type="button"
                    onClick={handleConfirmAllow}
                    className="btn-modal-allow"
                    disabled={isLocating}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>
                      {isLocating ? 'sync' : 'check'}
                    </span>
                    {isLocating ? 'Locating...' : 'Allow'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setBannerDismissed(true); }}
                    className="btn-modal-cancel"
                  >
                    Don't Allow
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
