const getBackendURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.hostname.includes('gmdpremiun.com') || window.location.hostname.includes('gmdpremium.com')) {
      return 'https://api.galassymeubledecor.shop';
    }
    if (window.location.hostname.includes('galassymeubledecor.shop')) {
      return 'https://api.galassymeubledecor.shop';
    }
    // Automatic fallback for Render deployments
    if (window.location.hostname.includes('onrender.com')) {
      return 'https://gmd-creance-backend.onrender.com';
    }
  }
  return 'http://localhost:5000';
};

export const API_URL = getBackendURL();
export const KKIAPAY_PUBLIC_KEY = import.meta.env.VITE_KKIAPAY_PUBLIC_KEY || 'pk_sandbox_XXXXXXXXX';
export const KKIAPAY_SANDBOX = true;
