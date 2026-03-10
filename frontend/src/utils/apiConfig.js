/**
 * API Configuration
 * Uses environment variable VITE_API_BASE_URL to determine the backend URL
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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
