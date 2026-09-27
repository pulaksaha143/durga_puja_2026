import React, { memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';

// Fix Leaflet's default icon issue with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapView = memo(function MapView({ pandals }) {
  // Center of Mumbai approximately
  const center = [19.0760, 72.8777];

  return (
    <div className="map-wrapper">
      <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} preferCanvas={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
