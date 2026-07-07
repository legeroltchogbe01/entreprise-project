const getBackendURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Automatic fallback for Render deployments
  if (typeof window !== 'undefined' && window.location && window.location.hostname.includes('onrender.com')) {
    return 'https://gmd-creance-backend.onrender.com';
  }
  return 'http://localhost:5000';
};

export const API_URL = getBackendURL();
