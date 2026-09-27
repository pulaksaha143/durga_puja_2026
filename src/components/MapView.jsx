import React, { memo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { useUserLocation } from '../hooks/useUserLocation';
import { createGreenUserPin } from '../utils/mapPins';

// Fix Leaflet's default icon issue with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Sub-component to fly to coordinates when requested
function MapFlyController({ targetCoord, flyCount }) {
  const map = useMap();
  useEffect(() => {
    if (targetCoord && targetCoord[0] && targetCoord[1]) {
      map.flyTo(targetCoord, 14, { duration: 1 });
    }
  }, [targetCoord, flyCount, map]);
  return null;
}

const MapView = memo(function MapView({ pandals = [] }) {
  const { userLocation, isLocating, requestLocation } = useUserLocation();
  const [flyTarget, setFlyTarget] = React.useState(null);
  const [flyCount, setFlyCount] = React.useState(0);
  const [mapNotice, setMapNotice] = React.useState('');
  const userMarkerRef = useRef(null);

  // Center of Mumbai approximately
  const defaultCenter = [19.0760, 72.8777];

  const handleCenterOnUser = () => {
    if (userLocation?.lat && userLocation?.lng) {
      setFlyTarget([userLocation.lat, userLocation.lng]);
      setFlyCount(c => c + 1);
      if (userMarkerRef.current) {
        userMarkerRef.current.openPopup();
      }
    } else {
      setMapNotice('📍 Requesting location from browser...');
      requestLocation(
        (coords) => {
          setFlyTarget([coords.lat, coords.lng]);
          setFlyCount(c => c + 1);
          setMapNotice('📍 Location found! Green pin centered.');
          setTimeout(() => setMapNotice(''), 3000);
        },
        (err) => {
          setMapNotice('⚠️ Location was declined. Allow location in browser lock icon.');
          setTimeout(() => setMapNotice(''), 4500);
        }
      );
    }
  };

  return (
    <div className="map-wrapper" style={{ position: 'relative' }}>
      {/* Floating GPS Locator Badge on Top-Right of Map */}
      <div className="map-user-location-badge">
        <button
          type="button"
          onClick={handleCenterOnUser}
          className={`btn-map-locate-me ${userLocation ? 'has-location' : ''}`}
          disabled={isLocating}
          title={userLocation ? 'Center map on your location' : 'Show your location on the map'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: userLocation ? '#10B981' : 'var(--sindoor)' }}>
            {isLocating ? 'sync' : userLocation ? 'my_location' : 'near_me'}
          </span>
          <span>
            {isLocating ? 'Locating...' : userLocation ? 'You Are Here (Green Pin)' : 'Show My Location'}
          </span>
        </button>

        {mapNotice && (
          <div style={{
            marginTop: '0.4rem',
            background: 'rgba(0, 0, 0, 0.85)',
            color: '#ffffff',
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            maxWidth: '220px',
            lineHeight: 1.3,
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.2s ease'
          }}>
            {mapNotice}
          </div>
        )}
      </div>

      <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }} preferCanvas={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapFlyController targetCoord={flyTarget} flyCount={flyCount} />

        {/* ALWAYS RENDER THE USER'S GREEN PIN IF LOCATION IS KNOWN */}
        {userLocation && userLocation.lat && userLocation.lng && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createGreenUserPin()}
            ref={userMarkerRef}
            zIndexOffset={1000}
          >
            <Popup>
              <div style={{ padding: '0.35rem 0.2rem', minWidth: '180px' }}>
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
                  marginBottom: '0.4rem',
                  textTransform: 'uppercase'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>my_location</span>
                  You Are Here
                </div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#047857', fontSize: '0.9375rem', fontWeight: 700 }}>
                  Your Live Location
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Showing your real-time GPS position relative to nearby pandals.
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Blue Pins for all Pandals */}
        {pandals.map((pandal) => {
          if (pandal.coordinates && pandal.coordinates.lat && pandal.coordinates.lng) {
            return (
              <Marker key={pandal.id} position={[pandal.coordinates.lat, pandal.coordinates.lng]}>
                <Popup>
                  <div style={{ padding: '0.25rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--sindoor)' }}>{pandal.name}</h4>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>{pandal.suburb}, {pandal.zone}</p>
                    <Link to={`/pandal/${pandal.id}`} style={{ display: 'inline-block', background: 'var(--marigold)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
                      View Details
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
});

export default MapView;
