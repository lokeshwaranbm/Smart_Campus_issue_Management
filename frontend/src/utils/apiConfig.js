/**
 * API Configuration
 * Uses environment variable VITE_API_BASE_URL to determine the backend URL
 */

// In production (Netlify) this is '' so relative /api/* paths are proxied to Render.
// In local dev set VITE_API_BASE_URL=http://localhost:5000 in frontend/.env, OR rely on
// Vite's built-in proxy (already configured in vite.config.js) with the empty default.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Constructs a full API URL
 * @param {string} endpoint - The API endpoint (e.g., '/api/staff')
 * @returns {string} - Full API URL
 */
export const getApiUrl = (endpoint) => {
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Wrapper for fetch with full URL resolution
 * @param {string} endpoint - The API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise} - Fetch response
 */
export const apiFetch = (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};
