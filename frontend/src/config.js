const getBackendURL = () => {
  if (typeof window !== 'undefined' && window.location) {
    // 1. Prioritize online production domains
    if (
      window.location.hostname.includes('gmdpremiun.com') || 
      window.location.hostname.includes('galassymeubledecor.shop')
    ) {
      return 'https://api.galassymeubledecor.shop';
    }
    // 2. Fallback for Render deployments
    if (window.location.hostname.includes('onrender.com')) {
      return 'https://gmd-creance-backend.onrender.com';
    }
  }
  
  // 3. Fallback to local environment variable or localhost
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:5000';
};

export const API_URL = getBackendURL();
export const KKIAPAY_PUBLIC_KEY = import.meta.env.VITE_KKIAPAY_PUBLIC_KEY || 'pk_sandbox_XXXXXXXXX';
export const KKIAPAY_SANDBOX = import.meta.env.VITE_KKIAPAY_SANDBOX === 'false' ? false : true;
