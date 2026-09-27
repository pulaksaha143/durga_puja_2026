import L from 'leaflet';

/**
 * Creates a prominent Emerald Green Pin for the User's Live Location on any map.
 * Features an SVG teardrop pin with a pulsing radar halo underneath.
 */
export const createGreenUserPin = () => {
  return L.divIcon({
    className: 'leaflet-user-green-pin',
    html: `
      <div class="user-green-pin-container">
        <div class="user-green-pin-pulse"></div>
        <svg class="user-green-pin-svg" width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 0C7.611 0 0 7.611 0 17C0 28.5 17 42 17 42C17 42 34 28.5 34 17C34 7.611 26.389 0 17 0Z" fill="#10B981" />
          <path d="M17 1.5C8.44 1.5 1.5 8.44 1.5 17C1.5 27.2 15.5 39.5 17 40.8C18.5 39.5 32.5 27.2 32.5 17C32.5 8.44 25.56 1.5 17 1.5Z" stroke="#047857" stroke-width="1.5" />
          <circle cx="17" cy="17" r="7.5" fill="#FFFFFF" />
          <circle cx="17" cy="17" r="4.5" fill="#059669" />
        </svg>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -44]
  });
};

/**
 * Custom Blue / Crimson Pandal Pin
 */
export const createPandalPin = (isHighlight = false) => {
  const fill = isHighlight ? '#b91c1c' : '#2563eb';
  const stroke = isHighlight ? '#7f1d1d' : '#1d4ed8';

  return L.divIcon({
    className: 'leaflet-pandal-pin',
    html: `
      <div class="pandal-pin-container">
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.268 0 0 6.268 0 14C0 24 14 36 14 36C14 36 28 24 28 14C28 6.268 21.732 0 14 0Z" fill="${fill}" />
          <path d="M14 1C6.82 1 1 6.82 1 14C1 22.8 12.8 33.7 14 34.9C15.2 33.7 27 22.8 27 14C27 6.82 21.18 1 14 1Z" stroke="${stroke}" stroke-width="1" />
          <circle cx="14" cy="14" r="6" fill="#FFFFFF" />
          <circle cx="14" cy="14" r="3" fill="${fill}" />
        </svg>
      </div>
    `,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -38]
  });
};
