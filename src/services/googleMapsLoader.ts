// Dynamic loader for Google Maps JavaScript API with maps3d library
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCrKg3gTPCDQDUhR7NVzT6D23VZljr-qXM';

let isScriptLoading = false;
let isScriptLoaded = false;
const loadCallbacks: Array<(success: boolean) => void> = [];

export function loadGoogleMaps3D(): Promise<boolean> {
  if (isScriptLoaded && window.google?.maps) {
    return Promise.resolve(true);
  }

  if (isScriptLoading) {
    return new Promise((resolve) => {
      loadCallbacks.push(resolve);
    });
  }

  isScriptLoading = true;

  return new Promise((resolve) => {
    loadCallbacks.push(resolve);

    // Check if already injected
    if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
      isScriptLoaded = true;
      isScriptLoading = false;
      loadCallbacks.forEach((cb) => cb(true));
      loadCallbacks.length = 0;
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?loading=async&key=${API_KEY}&libraries=maps3d,marker,geometry,places`;
    script.async = true;

    script.onload = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      loadCallbacks.forEach((cb) => cb(true));
      loadCallbacks.length = 0;
    };

    script.onerror = (e) => {
      console.warn('Failed to load Google Maps 3D script:', e);
      isScriptLoaded = false;
      isScriptLoading = false;
      loadCallbacks.forEach((cb) => cb(false));
      loadCallbacks.length = 0;
    };

    document.head.appendChild(script);
  });
}
