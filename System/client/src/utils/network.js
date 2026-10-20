/**
 * Dynamically resolves the API Base URL and Socket.IO URL.
 * Supports:
 * - PC accessing https://localhost:5173 or http://localhost:5173
 * - Mobile accessing https://192.168.x.x:5173 or http://192.168.x.x:5173
 * - Proxied seamlessly through Vite dev server to backend Express on port 5000
 */

export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  // If explicitly configured to an external domain (e.g. Cloudflare tunnel, Render, production domain), use it
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // When running in local development with Vite dev server proxy
  if (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return `${window.location.origin}/api`;
  }

  return envUrl || 'http://localhost:5000/api';
};

export const getSocketUrl = () => {
  const apiBase = getApiBaseUrl();
  return apiBase.replace(/\/api\/?$/, '');
};

