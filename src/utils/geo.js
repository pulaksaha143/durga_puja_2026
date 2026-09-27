/**
 * Calculates straight-line distance in kilometers between two lat/lng points using Haversine formula
 */
export function getHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

/**
 * Fetches actual road network distance in km from user coordinates to all pandals in a single batch call.
 * Uses OSRM (Open Source Routing Machine) road distance matrix API.
 */
export async function fetchRoadDistances(userLat, userLng, pandals) {
  if (!userLat || !userLng || !pandals || pandals.length === 0) return {};

  const validPandals = pandals.filter(p => p.coordinates?.lat && p.coordinates?.lng);
  if (validPandals.length === 0) return {};

  // Construct batch coordinates string: user location followed by all pandals
  const coordsStr = [
    `${userLng},${userLat}`,
    ...validPandals.map(p => `${p.coordinates.lng},${p.coordinates.lat}`)
  ].join(';');

  const url = `https://router.project-osrm.org/table/v1/driving/${coordsStr}?sources=0&annotations=distance`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const data = await res.json();

    if (data.code === 'Ok' && data.distances && data.distances[0]) {
      const roadMap = {};
      const distancesMeters = data.distances[0];

      validPandals.forEach((pandal, idx) => {
        const meters = distancesMeters[idx + 1]; // index 0 is user to user
        if (meters !== null && meters !== undefined && meters >= 0) {
          roadMap[pandal.id] = meters / 1000; // convert to km
        } else {
          const hav = getHaversineDistance(userLat, userLng, pandal.coordinates.lat, pandal.coordinates.lng);
          roadMap[pandal.id] = hav ? hav * 1.3 : null;
        }
      });

      return roadMap;
    }
  } catch (err) {
    console.warn('OSRM road distance API call failed, falling back to estimated road distance:', err);
  }

  // Graceful Fallback: Haversine distance multiplied by standard urban road factor (1.3)
  const fallbackMap = {};
  validPandals.forEach(pandal => {
    const hav = getHaversineDistance(userLat, userLng, pandal.coordinates.lat, pandal.coordinates.lng);
    fallbackMap[pandal.id] = hav ? hav * 1.3 : null;
  });
  return fallbackMap;
}

/**
 * Format distance to human-readable string (e.g., "850 m away" or "2.4 km away")
 */
export function formatDistance(km) {
  if (km === null || km === undefined) return '';
  if (km < 1) {
    return `${Math.round(km * 1000)} m away`;
  }
  return `${km.toFixed(1)} km away`;
}

/**
 * Share helper for native share or clipboard fallback
 */
export async function shareContent({ title, text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { success: true, method: 'native' };
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
      return { success: false, error: err };
    }
  } else {
    try {
      await navigator.clipboard.writeText(url || text);
      return { success: true, method: 'clipboard' };
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      return { success: false, error: err };
    }
  }
}
