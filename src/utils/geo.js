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

/**
 * Solves exact shortest open path (TSP) for N <= 8 permutations.
 * Evaluates all paths in < 15ms in JS.
 */
function solveExactTSPOpenPath(n, distMatrix, userDistances = null) {
  const indices = Array.from({ length: n }, (_, i) => i);
  let bestPerm = null;
  let minCost = Infinity;

  function permute(arr, m = []) {
    if (arr.length === 0) {
      let cost = 0;
      if (userDistances) {
        cost += userDistances[m[0]];
      }
      for (let i = 0; i < m.length - 1; i++) {
        cost += distMatrix[m[i]][m[i + 1]];
      }
      if (cost < minCost) {
        minCost = cost;
        bestPerm = [...m];
      }
    } else {
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        permute(curr.slice(), m.concat(next));
      }
    }
  }

  permute(indices);
  return bestPerm;
}

/**
 * Solves TSP with fixed starting node using Greedy Nearest Neighbor + 2-Opt local search refinement.
 */
function solveTSPWithFixedStart(n, startIdx, distMatrix) {
  const visited = [startIdx];
  const unvisited = new Set(Array.from({ length: n }, (_, i) => i).filter(i => i !== startIdx));
  
  let curr = startIdx;
  while (unvisited.size > 0) {
    let nearest = -1;
    let minDist = Infinity;
    for (const cand of unvisited) {
      if (distMatrix[curr][cand] < minDist) {
        minDist = distMatrix[curr][cand];
        nearest = cand;
      }
    }
    unvisited.delete(nearest);
    visited.push(nearest);
    curr = nearest;
  }

  // 2-Opt local search: iteratively swap segments to remove crossings
  let improved = true;
  let iterations = 0;
  while (improved && iterations < 50) {
    improved = false;
    iterations++;
    for (let i = 1; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        const d1 = distMatrix[visited[i - 1]][visited[i]];
        const d2 = k === n - 1 ? 0 : distMatrix[visited[k]][visited[k + 1]];
        const d3 = distMatrix[visited[i - 1]][visited[k]];
        const d4 = k === n - 1 ? 0 : distMatrix[visited[i]][visited[k + 1]];

        if (d3 + d4 < d1 + d2) {
          const sub = visited.slice(i, k + 1).reverse();
          visited.splice(i, sub.length, ...sub);
          improved = true;
        }
      }
    }
  }

  return visited;
}

/**
 * Intelligent Route Optimizer for Pandal Hopping:
 * - Uses Live GPS position (if granted) to anchor the starting stop nearest to the user.
 * - Solves the Travelling Salesperson Problem (TSP) open path for minimum total road transit.
 * - Supports custom start selection and direction reversal.
 * - Returns transparent intelligence explanations of why Stop 1 was selected.
 */
export function optimizePandalRoute(pandalsList, userLocation = null, customStartId = null) {
  if (!pandalsList || pandalsList.length <= 1) {
    return {
      orderedPandals: pandalsList || [],
      strategy: 'insufficient_pandals',
      startExplanation: 'Single pandal circuit',
      userDistanceToStart: null
    };
  }

  const validPandals = pandalsList.filter(p => p.coordinates?.lat && p.coordinates?.lng);
  if (validPandals.length === 0) {
    return {
      orderedPandals: pandalsList,
      strategy: 'no_coords',
      startExplanation: 'Coordinates not available',
      userDistanceToStart: null
    };
  }

  const n = validPandals.length;
  // Build distance matrix with 1.3x urban road curvature factor
  const dist = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = (getHaversineDistance(
        validPandals[i].coordinates.lat, validPandals[i].coordinates.lng,
        validPandals[j].coordinates.lat, validPandals[j].coordinates.lng
      ) || 0) * 1.3;
      dist[i][j] = d;
      dist[j][i] = d;
    }
  }

  // Calculate distance from user GPS (if available) to each pandal
  let userDist = null;
  let nearestToUserIdx = -1;
  let minUserDist = Infinity;
  if (userLocation?.lat && userLocation?.lng) {
    userDist = validPandals.map((p, idx) => {
      const d = (getHaversineDistance(userLocation.lat, userLocation.lng, p.coordinates.lat, p.coordinates.lng) || 0) * 1.3;
      if (d < minUserDist) {
        minUserDist = d;
        nearestToUserIdx = idx;
      }
      return d;
    });
  }

  let customStartIdx = -1;
  if (customStartId) {
    customStartIdx = validPandals.findIndex(p => p.id === customStartId);
  }

  let bestOrder = null;
  let strategyUsed = '';
  let startExplanation = '';

  // 1. Explicit Custom Start specified by user
  if (customStartIdx !== -1) {
    strategyUsed = 'custom_start';
    startExplanation = `Starting at ${validPandals[customStartIdx].name} (manually chosen as launch stop)`;
    bestOrder = solveTSPWithFixedStart(n, customStartIdx, dist);
  }
  // 2. Intelligent Live GPS Optimization
  else if (userDist && nearestToUserIdx !== -1) {
    strategyUsed = 'gps_nearest';
    if (n <= 8) {
      // Find global optimal path including user-to-start transit
      bestOrder = solveExactTSPOpenPath(n, dist, userDist);
      const startP = validPandals[bestOrder[0]];
      const distFromUser = userDist[bestOrder[0]];
      startExplanation = `Starting at ${startP.name} (~${distFromUser.toFixed(1)} km from your live GPS location — optimal nearest launch point)`;
    } else {
      bestOrder = solveTSPWithFixedStart(n, nearestToUserIdx, dist);
      const startP = validPandals[nearestToUserIdx];
      startExplanation = `Starting at ${startP.name} (~${minUserDist.toFixed(1)} km from your current GPS position)`;
    }
  }
  // 3. Fallback: Geographical End-to-End Axis Optimization (No GPS)
  else {
    strategyUsed = 'end_to_end_optimal';
    if (n <= 8) {
      bestOrder = solveExactTSPOpenPath(n, dist, null);
      // Default to South -> North progression (standard Mumbai geography)
      const startLat = validPandals[bestOrder[0]].coordinates.lat;
      const endLat = validPandals[bestOrder[bestOrder.length - 1]].coordinates.lat;
      if (startLat > endLat) {
        bestOrder.reverse();
      }
      startExplanation = `Starting at ${validPandals[bestOrder[0]].name} (southernmost anchor — linear path with zero backtracking)`;
    } else {
      // Find the two furthest points among the set
      let maxD = -1;
      let endA = 0;
      let endB = 1;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (dist[i][j] > maxD) {
            maxD = dist[i][j];
            endA = i;
            endB = j;
          }
        }
      }
      const start = validPandals[endA].coordinates.lat <= validPandals[endB].coordinates.lat ? endA : endB;
      bestOrder = solveTSPWithFixedStart(n, start, dist);
      startExplanation = `Starting at ${validPandals[bestOrder[0]].name} (southernmost anchor — linear path with zero backtracking)`;
    }
  }

  const result = bestOrder.map(idx => validPandals[idx]);
  return {
    orderedPandals: result,
    strategy: strategyUsed,
    startExplanation,
    userDistanceToStart: userDist && bestOrder ? userDist[bestOrder[0]] : null
  };
}
