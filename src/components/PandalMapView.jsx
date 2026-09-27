import React, { memo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useUserLocation } from '../hooks/useUserLocation';
import { createGreenUserPin, createPandalPin } from '../utils/mapPins';
import { getHaversineDistance, formatDistance } from '../utils/geo';

// Sub-component to manage map bounds between pandal and user location
function PandalMapBoundsController({ pandalCoord, userLocation }) {
  const map = useMap();

  useEffect(() => {
    if (!pandalCoord || !pandalCoord.lat || !pandalCoord.lng) return;

    if (userLocation && userLocation.lat && userLocation.lng) {
      const bounds = L.latLngBounds([
        [pandalCoord.lat, pandalCoord.lng],
        [userLocation.lat, userLocation.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
    } else {
      map.setView([pandalCoord.lat, pandalCoord.lng], 14, { animate: true });
    }
  }, [pandalCoord, userLocation, map]);

  return null;
}

const PandalMapView = memo(function PandalMapView({ pandal }) {
  const { userLocation, isLocating, requestLocation } = useUserLocation();
  const [mapType, setMapType] = useState('interactive'); // 'interactive' | 'embed'

  const pandalCoord = pandal?.coordinates;
  const hasCoordinates = Boolean(pandalCoord?.lat && pandalCoord?.lng);

  // Compute straight-line and estimated road distance between user and pandal
  const distanceKm = React.useMemo(() => {
    if (!userLocation || !hasCoordinates) return null;
    const straightDist = getHaversineDistance(
      userLocation.lat,
      userLocation.lng,
      pandalCoord.lat,
      pandalCoord.lng
    );
    return straightDist !== null ? straightDist * 1.3 : null;
  }, [userLocation, hasCoordinates, pandalCoord]);

  if (!hasCoordinates && !pandal.mapEmbedUrl) {
    return null;
  }

  return (
    <div className="pandal-map-wrapper">
      {/* Header bar with Map Controls & Distance Info */}
      <div className="pandal-map-header">
        <div className="pandal-map-title-group">
          <span className="material-symbols-outlined" style={{ color: 'var(--sindoor)', fontSize: '1.25rem' }}>
            place
          </span>
          <span className="pandal-map-heading">
            <strong>Location Map</strong>
          </span>
          {distanceKm !== null && (
            <span className="pandal-distance-chip">
              <span className="material-symbols-outlined" style={{ fontSize: '0.85rem', color: '#059669' }}>
                near_me
              </span>
              ~{distanceKm.toFixed(1)} km from your location
            </span>
          )}
        </div>

        <div className="pandal-map-controls">
          {!userLocation && (
            <button
              type="button"
              onClick={() => requestLocation()}
              className="btn-locate-user-map"
              disabled={isLocating}
              title="Show your current location on this map"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: '#10B981' }}>
                {isLocating ? 'sync' : 'my_location'}
              </span>
              {isLocating ? 'Locating...' : 'Show My Location (Green Pin)'}
            </button>
          )}

          {userLocation && (
            <div className="badge-user-active">
              <span className="green-pulse-dot"></span>
              You (Green Pin) Active
            </div>
          )}

          {pandal.mapEmbedUrl && (
            <div className="pandal-map-type-toggle">
              <button
                type="button"
                onClick={() => setMapType('interactive')}
                className={`type-btn ${mapType === 'interactive' ? 'active' : ''}`}
              >
                Live Map
              </button>
              <button
                type="button"
                onClick={() => setMapType('embed')}
                className={`type-btn ${mapType === 'embed' ? 'active' : ''}`}
              >
                Google View
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map Content View */}
      {mapType === 'interactive' && hasCoordinates ? (
        <div className="pandal-leaflet-canvas" style={{ height: '360px', width: '100%', position: 'relative' }}>
          <MapContainer
            center={[pandalCoord.lat, pandalCoord.lng]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            preferCanvas={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <PandalMapBoundsController pandalCoord={pandalCoord} userLocation={userLocation} />

            {/* Connecting dashed line from user Green Pin to Pandal Blue Pin */}
            {userLocation?.lat && userLocation?.lng && (
              <Polyline
                positions={[
                  [userLocation.lat, userLocation.lng],
                  [pandalCoord.lat, pandalCoord.lng]
                ]}
                pathOptions={{
                  color: '#10B981',
                  weight: 3.5,
                  dashArray: '6, 8',
                  opacity: 0.8
                }}
              />
            )}

            {/* GREEN PIN FOR USER LIVE LOCATION */}
            {userLocation?.lat && userLocation?.lng && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={createGreenUserPin()}
                zIndexOffset={1000}
              >
                <Popup>
                  <div style={{ padding: '0.25rem', minWidth: '170px' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: '#10B981',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      marginBottom: '0.35rem'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>my_location</span>
                      You Are Here
                    </div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: '#047857', fontSize: '0.9rem' }}>
                      Your Live Location
                    </h4>
                    {distanceKm !== null && (
                      <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--text-dim)' }}>
                        Distance to {pandal.name}: <strong>~{distanceKm.toFixed(1)} km</strong>
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* BLUE PIN FOR PANDAL LOCATION */}
            <Marker
              position={[pandalCoord.lat, pandalCoord.lng]}
              icon={createPandalPin(true)}
            >
              <Popup>
                <div style={{ padding: '0.25rem', minWidth: '180px' }}>
                  <div style={{
                    display: 'inline-block',
                    background: 'var(--sindoor)',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    marginBottom: '0.35rem'
                  }}>
                    PANDAL VENUE
                  </div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--sindoor)', fontSize: '0.9375rem' }}>
                    {pandal.name}
                  </h4>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                    {pandal.venue}, {pandal.suburb}
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${pandalCoord.lat},${pandalCoord.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      background: 'var(--sindoor)',
                      color: '#ffffff',
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      textDecoration: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>directions</span>
                    Directions in Google Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      ) : (
        /* Fallback / Google Embed Frame */
        <div className="pandal-embed-canvas" style={{ height: '360px', width: '100%', overflow: 'hidden' }}>
          <iframe
            src={pandal.mapEmbedUrl}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map of ${pandal.name}`}
            style={{ border: 'none', width: '100%', height: '100%' }}
          />
        </div>
      )}
    </div>
  );
});

export default PandalMapView;
