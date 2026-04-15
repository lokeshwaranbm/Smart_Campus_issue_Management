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
  let session = null;

  try {
    const SESSION_KEY = 'smart-campus-session';
    const rawSession = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    session = JSON.parse(rawSession || 'null');
  } catch {
    session = null;
  }

  const hasFormDataBody = typeof FormData !== 'undefined' && options?.body instanceof FormData;

  const doFetch = (authToken) =>
    fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...(hasFormDataBody ? {} : { 'Content-Type': 'application/json' }),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    });

  const currentAccessToken = session?.accessToken || null;

  return doFetch(currentAccessToken).then(async (response) => {
    const isAuthEndpoint = endpoint.includes('/api/auth/login') || endpoint.includes('/api/auth/refresh');
    if (response.status !== 401 || isAuthEndpoint) {
      return response;
    }

    // Attempt one refresh token rotation using HttpOnly refresh cookie.
    const refreshResponse = await fetch(getApiUrl('/api/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!refreshResponse.ok) {
      return response;
    }

    const refreshBody = await refreshResponse.json().catch(() => null);
    const nextAccessToken = refreshBody?.data?.accessToken || null;
    if (!nextAccessToken || !session) {
      return response;
    }

    const SESSION_KEY = 'smart-campus-session';
    const updatedSession = { ...session, accessToken: nextAccessToken };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));

    return doFetch(nextAccessToken);
  });
};
