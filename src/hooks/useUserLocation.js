import { useState, useEffect, useCallback } from 'react';

// Shared global state across all components and maps
let globalUserLocation = null;
let globalIsLocating = false;
let globalIsPermissionDenied = false;
let globalLocationError = null;
let globalPermissionState = 'unknown'; // 'unknown' | 'prompt' | 'granted' | 'denied'
let globalBannerDismissed = false;
const listeners = new Set();

// Load stored location & dismissal state from localStorage / sessionStorage
try {
  const saved = localStorage.getItem('mp_user_coords') || sessionStorage.getItem('mp_user_coords');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed && parsed.lat && parsed.lng) {
      globalUserLocation = parsed;
      globalPermissionState = 'granted';
      globalBannerDismissed = true;
    }
  }
  if (!globalUserLocation) {
    globalBannerDismissed = sessionStorage.getItem('mp_loc_banner_dismissed') === 'true';
  }
} catch (e) {
  // Ignore storage errors
}

const notifyListeners = () => {
  const payload = {
    userLocation: globalUserLocation,
    isLocating: globalIsLocating,
    isPermissionDenied: globalIsPermissionDenied,
    locationError: globalLocationError,
    permissionState: globalPermissionState,
    bannerDismissed: globalBannerDismissed
  };
  listeners.forEach(listener => listener(payload));
};

export const setGlobalBannerDismissed = (dismissed) => {
  globalBannerDismissed = dismissed;
  try {
    if (dismissed) {
      sessionStorage.setItem('mp_loc_banner_dismissed', 'true');
    } else {
      sessionStorage.removeItem('mp_loc_banner_dismissed');
    }
  } catch {}
  notifyListeners();
};

/**
 * Check if we are in a secure context (HTTPS or localhost).
 * Geolocation API requires a secure context in modern browsers.
 */
const isSecureContext = () => {
  if (window.isSecureContext !== undefined) return window.isSecureContext;
  const loc = window.location;
  return loc.protocol === 'https:' || loc.hostname === 'localhost' || loc.hostname === '127.0.0.1' || loc.hostname === '';
};

/**
 * Request the user's geolocation.
 * Should only be called in response to a user gesture (button click) so the browser
 * actually shows its native "Allow / Block" dialog.
 */
export const requestUserLocationGlobal = (onSuccess, onError) => {
  // Check secure context first
  if (!isSecureContext()) {
    globalLocationError = 'Location requires HTTPS. This page is not served securely.';
    globalIsPermissionDenied = true;
    notifyListeners();
    if (onError) onError(new Error(globalLocationError));
    return;
  }

  if (!navigator.geolocation) {
    globalLocationError = 'Geolocation is not supported by your browser.';
    globalIsPermissionDenied = true;
    globalPermissionState = 'denied';
    notifyListeners();
    if (onError) onError(new Error(globalLocationError));
    return;
  }

  globalIsLocating = true;
  globalLocationError = null;
  notifyListeners();

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: Date.now()
      };
      globalUserLocation = coords;
      globalIsLocating = false;
      globalIsPermissionDenied = false;
      globalLocationError = null;
      globalPermissionState = 'granted';
      globalBannerDismissed = true;
      try {
        localStorage.setItem('mp_user_coords', JSON.stringify(coords));
        sessionStorage.setItem('mp_user_coords', JSON.stringify(coords));
        sessionStorage.removeItem('mp_loc_banner_dismissed');
      } catch (err) {}
      notifyListeners();
      if (onSuccess) onSuccess(coords);
    },
    (err) => {
      globalIsLocating = false;
      const isDenied = err.code === 1; // PERMISSION_DENIED
      globalIsPermissionDenied = isDenied;
      globalPermissionState = isDenied ? 'denied' : 'prompt';
      globalLocationError = isDenied
        ? 'Location permission was declined.'
        : err.code === 3
          ? 'Location request timed out. Please try again.'
          : 'Unable to retrieve location. Please check your GPS or network.';
      notifyListeners();
      if (onError) onError(err);
    },
    { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
  );
};

/**
 * Silently fetch location only when permission is already 'granted'.
 * Does not trigger a prompt. Used for returning visitors.
 */
const silentFetchLocation = () => {
  if (!navigator.geolocation || globalUserLocation || globalIsLocating) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: Date.now()
      };
      globalUserLocation = coords;
      globalIsPermissionDenied = false;
      globalLocationError = null;
      globalPermissionState = 'granted';
      globalBannerDismissed = true;
      try {
        localStorage.setItem('mp_user_coords', JSON.stringify(coords));
        sessionStorage.setItem('mp_user_coords', JSON.stringify(coords));
      } catch {}
      notifyListeners();
    },
    () => { /* silent fail */ },
    { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
  );
};

export function useUserLocation() {
  const [state, setState] = useState({
    userLocation: globalUserLocation,
    isLocating: globalIsLocating,
    isPermissionDenied: globalIsPermissionDenied,
    locationError: globalLocationError,
    permissionState: globalPermissionState,
    bannerDismissed: globalBannerDismissed
  });

  useEffect(() => {
    listeners.add(setState);

    // Sync immediately if globals changed before this effect ran
    setState({
      userLocation: globalUserLocation,
      isLocating: globalIsLocating,
      isPermissionDenied: globalIsPermissionDenied,
      locationError: globalLocationError,
      permissionState: globalPermissionState,
      bannerDismissed: globalBannerDismissed
    });

    // Silently check permission state using Permissions API (no prompt triggered)
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        globalPermissionState = result.state;
        if (result.state === 'denied') {
          globalIsPermissionDenied = true;
        } else if (result.state === 'granted' && !globalUserLocation) {
          globalIsPermissionDenied = false;
          silentFetchLocation();
        }
        notifyListeners();

        // Auto-react when user resets permission via browser UI
        result.onchange = () => {
          globalPermissionState = result.state;
          if (result.state === 'granted') {
            globalIsPermissionDenied = false;
            silentFetchLocation();
          } else if (result.state === 'denied') {
            globalIsPermissionDenied = true;
            globalUserLocation = null;
            try {
              localStorage.removeItem('mp_user_coords');
              sessionStorage.removeItem('mp_user_coords');
            } catch {}
          } else if (result.state === 'prompt') {
            // Permission was reset — user can try again
            globalIsPermissionDenied = false;
          }
          notifyListeners();
        };
      }).catch(() => {});
    }

    return () => listeners.delete(setState);
  }, []);

  const requestLocation = useCallback((onSuccess, onError) => {
    requestUserLocationGlobal(onSuccess, onError);
  }, []);

  const setBannerDismissed = useCallback((dismissed) => {
    setGlobalBannerDismissed(dismissed);
  }, []);

  return {
    userLocation: state.userLocation,
    isLocating: state.isLocating,
    isPermissionDenied: state.isPermissionDenied,
    locationError: state.locationError,
    permissionState: state.permissionState,
    bannerDismissed: state.bannerDismissed,
    requestLocation,
    setBannerDismissed
  };
}
