import React, { memo, useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { createGreenUserPin } from '../utils/mapPins';

// Helper to create custom numbered HTML markers for each circuit stop
const createNumberedIcon = (order, isFirst, isLast, isSelected) => {
  const bg = isFirst 
    ? '#b91c1c' // Sindoor red for Start
    : isLast 
      ? '#d97706' // Warm Amber for Finish
      : '#334155'; // Slate for intermediate stops

  const size = isSelected ? 36 : 30;
  const fontSize = isSelected ? '14px' : '12px';
  const border = isSelected 
    ? 'border: 3px solid #facc15; box-shadow: 0 0 12px rgba(250, 204, 21, 0.7);' 
    : 'border: 2px solid #ffffff; box-shadow: 0 3px 8px rgba(0,0,0,0.35);';

  return L.divIcon({
    className: 'custom-route-marker-leaf',
    html: `
      <div style="
        background: ${bg};
        color: #ffffff;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: ${fontSize};
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        ${border}
        position: relative;
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        ${order}
        ${isFirst ? '<span style="position: absolute; top: -5px; right: -5px; background: #eab308; color: #78350f; border-radius: 50%; width: 14px; height: 14px; font-size: 8px; display: flex; align-items: center; justify-content: center; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">★</span>' : ''}
        ${isLast ? '<span style="position: absolute; top: -5px; right: -5px; background: #10b981; color: white; border-radius: 50%; width: 14px; height: 14px; font-size: 8px; display: flex; align-items: center; justify-content: center; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">🏁</span>' : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)]
  });
};

// Live GPS marker for the user's current location
const createGpsIcon = () => {
  return L.divIcon({
    className: 'custom-gps-marker-leaf',
    html: `
      <div style="
        background: #2563eb;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.35), 0 3px 8px rgba(0,0,0,0.3);
      ">
        <span style="width: 7px; height: 7px; background: #ffffff; border-radius: 50%;"></span>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12]
  });
};

// Sub-component to manage map viewport, auto-bounding, and flying to focused stops
function MapController({ allCoords, focusedCoord, triggerFly }) {
  const map = useMap();

  // Fit all stops when circuit pandals change
  useEffect(() => {
    if (allCoords && allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14, animate: true });
    }
  }, [allCoords, map]);

  // Fly to a specific stop if selected
  useEffect(() => {
    if (focusedCoord && focusedCoord[0] && focusedCoord[1]) {
      map.flyTo(focusedCoord, 14, { duration: 0.75 });
    }
  }, [focusedCoord, triggerFly, map]);

  return null;
}

const CircuitMapView = memo(function CircuitMapView({
  pandals = [],
  userLocation = null,
  isOptimized = false,
  totalDistanceKm = 0,
  estimatedTravelMins = 0,
  onSetStart = null
}) {
  const [selectedPandalId, setSelectedPandalId] = useState(null);
  const [flyTrigger, setFlyTrigger] = useState(0);
  const markerRefs = useRef({});

  // Compute polyline coordinates from pandals with valid lat/lng
  const polylineCoords = useMemo(() => {
    return pandals
      .filter(p => p.coordinates?.lat && p.coordinates?.lng)
      .map(p => [p.coordinates.lat, p.coordinates.lng]);
  }, [pandals]);

  // All coordinates including user GPS for bounds fitting
  const allFitCoords = useMemo(() => {
    const coords = [...polylineCoords];
    if (userLocation?.lat && userLocation?.lng) {
      coords.push([userLocation.lat, userLocation.lng]);
    }
    return coords;
  }, [polylineCoords, userLocation]);

  // GPS connector polyline to Stop 1
  const gpsConnectorCoords = useMemo(() => {
    if (userLocation?.lat && userLocation?.lng && polylineCoords.length > 0) {
      return [
        [userLocation.lat, userLocation.lng],
        polylineCoords[0]
      ];
    }
    return null;
  }, [userLocation, polylineCoords]);

  // Center coordinate fallback (Central Mumbai)
  const defaultCenter = useMemo(() => {
    if (polylineCoords.length > 0) return polylineCoords[0];
    return [19.0760, 72.8777];
  }, [polylineCoords]);

  const focusedCoord = useMemo(() => {
    if (!selectedPandalId) return null;
    const target = pandals.find(p => p.id === selectedPandalId);
    if (target?.coordinates?.lat && target?.coordinates?.lng) {
      return [target.coordinates.lat, target.coordinates.lng];
    }
    return null;
  }, [selectedPandalId, pandals]);

  // Focus a specific stop from the bottom carousel
  const handleSelectStop = (pandal) => {
    setSelectedPandalId(pandal.id);
    setFlyTrigger(prev => prev + 1);
    const marker = markerRefs.current[pandal.id];
    if (marker) {
      marker.openPopup();
    }
  };

  // Reset to full circuit overview
  const handleFitAll = () => {
    setSelectedPandalId(null);
    setFlyTrigger(prev => prev + 1);
  };

  return (
    <div className="circuit-map-container">
      {/* Map Header Status Banner */}
      <div className="circuit-map-header-bar">
        <div className="circuit-map-header-left">
          <span className="material-symbols-outlined" style={{ color: 'var(--sindoor)', fontSize: '1.25rem' }}>
            timeline
          </span>
          <span className="circuit-map-header-title">
            <strong>Hopping Circuit Route</strong> ({pandals.length} stops)
          </span>
          {isOptimized && (
            <span className="badge-optimized-pill">
              <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>auto_awesome</span>
              Optimal Path
            </span>
          )}
        </div>

        <div className="circuit-map-header-right">
          {totalDistanceKm > 0 && (
            <span className="circuit-map-stat">
              ~{totalDistanceKm.toFixed(1)} km • ~{estimatedTravelMins} mins
            </span>
          )}
          <button 
            type="button" 
            onClick={handleFitAll} 
            className="btn-fit-overview"
            title="Reset zoom to view all stops"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>fit_screen</span>
            Overview
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="circuit-map-canvas-wrap">
        <MapContainer
          center={defaultCenter}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          preferCanvas={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController 
            allCoords={selectedPandalId ? null : allFitCoords} 
            focusedCoord={focusedCoord} 
            triggerFly={flyTrigger} 
          />

          {/* User GPS Live Location Marker - ALWAYS GREEN PIN */}
          {userLocation && (
            <Marker 
              position={[userLocation.lat, userLocation.lng]} 
              icon={createGreenUserPin()}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="circuit-popup-card">
                  <div className="circuit-popup-tag" style={{ background: '#10B981', color: '#fff' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>my_location</span>
                    Your Live Location (Green Pin)
                  </div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#047857', fontSize: '0.9375rem', fontWeight: 700 }}>
                    You Are Here
                  </h4>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                    Circuit route starts from here to Stop 1
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Dashed connector line from GPS Green Pin to Stop 1 */}
          {gpsConnectorCoords && (
            <Polyline
              positions={gpsConnectorCoords}
              pathOptions={{
                color: '#10B981',
                weight: 3.5,
                dashArray: '6, 8',
                opacity: 0.85
              }}
            />
          )}

          {/* Circuit Polyline Path connecting stops 1 -> 2 -> ... -> N */}
          {polylineCoords.length > 1 && (
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#b91c1c',
                weight: 4.5,
                opacity: 0.85,
                lineJoin: 'round',
                lineCap: 'round',
                dashArray: isOptimized ? '8, 8' : undefined
              }}
            />
          )}

          {/* Numbered Pins for each Pandal stop */}
          {pandals.map((pandal, idx) => {
            if (!pandal.coordinates?.lat || !pandal.coordinates?.lng) return null;
            const order = idx + 1;
            const isFirst = idx === 0;
            const isLast = idx === pandals.length - 1 && pandals.length > 1;
            const isSelected = pandal.id === selectedPandalId;

            return (
              <Marker
                key={pandal.id}
                position={[pandal.coordinates.lat, pandal.coordinates.lng]}
                icon={createNumberedIcon(order, isFirst, isLast, isSelected)}
                ref={el => { if (el) markerRefs.current[pandal.id] = el; }}
                eventHandlers={{
                  click: () => setSelectedPandalId(pandal.id)
                }}
              >
                <Popup>
                  <div className="circuit-popup-card">
                    <div className="circuit-popup-tag" style={{
                      background: isFirst ? 'var(--sindoor)' : isLast ? '#d97706' : '#334155',
                      color: '#ffffff'
                    }}>
                      {isFirst ? '★ STOP 1 • START' : isLast ? '🏁 FINAL STOP' : `STOP ${order} OF ${pandals.length}`}
                    </div>

                    <h4 className="circuit-popup-title">{pandal.name}</h4>
                    <p className="circuit-popup-suburb">{pandal.suburb}, {pandal.zone}</p>

                    <div className="circuit-popup-actions">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${pandal.coordinates.lat},${pandal.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-popup-nav"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>directions</span>
                        Directions
                      </a>
                      <Link to={`/pandal/${pandal.id}`} className="btn-popup-details">
                        Details ↗
                      </Link>
                    </div>

                    {onSetStart && !isFirst && (
                      <button
                        type="button"
                        onClick={() => onSetStart(pandal.id)}
                        className="btn-popup-set-start"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>flag</span>
                        Make 1st Stop
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Interactive Horizontal Stop Selector Ribbon */}
      <div className="circuit-stops-ribbon">
        <div className="circuit-stops-ribbon-scroll">
          {pandals.map((pandal, idx) => {
            const order = idx + 1;
            const isFirst = idx === 0;
            const isLast = idx === pandals.length - 1 && pandals.length > 1;
            const isSelected = pandal.id === selectedPandalId;

            return (
              <button
                key={pandal.id}
                type="button"
                onClick={() => handleSelectStop(pandal)}
                className={`stop-ribbon-pill ${isSelected ? 'active' : ''} ${isFirst ? 'is-first' : ''}`}
                title={`Focus Stop ${order}: ${pandal.name}`}
              >
                <span className="stop-pill-number">
                  {order}
                </span>
                <span className="stop-pill-name">{pandal.name}</span>
                {isFirst && <span className="stop-pill-badge start">Start</span>}
                {isLast && <span className="stop-pill-badge end">End</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default CircuitMapView;
