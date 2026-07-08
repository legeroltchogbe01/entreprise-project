const getBackendURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.hostname.includes('gmdpremiun.com')) {
      return 'https://api.gmdpremiun.com';
    }
    // Automatic fallback for Render deployments
    if (window.location.hostname.includes('onrender.com')) {
      return 'https://gmd-creance-backend.onrender.com';
    }
  }
  return 'http://localhost:5000';
};

export const API_URL = getBackendURL();
