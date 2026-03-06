/**
 * API Helper — Centralized fetch wrapper with JWT auth support.
 */

const API_BASE = 'http://localhost:8000';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', token);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
}

export function isAuthenticated() {
  return !!getToken();
}

/**
 * Authenticated fetch wrapper.
 * Automatically attaches the Bearer token and handles 401s.
 */
export async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  return res;
}
