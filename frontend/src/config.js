/**
 * API base URL for fetch calls.
 * - Local dev: `/api` (proxied to localhost:8000 by Vite)
 * - Production: set VITE_API_URL to your Render backend, e.g. https://robodocs-api.onrender.com
 */
const configured = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export const API_BASE = configured || '/api';

/** Build a full API path, e.g. apiUrl('/chat') */
export function apiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE === '/api') {
    return `${API_BASE}${normalized}`;
  }
  return `${API_BASE}${normalized}`;
}
