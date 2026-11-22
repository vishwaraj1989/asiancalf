const API_BASE_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

export function apiUrl(path) {
  if (!API_BASE_URL && process.env.NODE_ENV === 'production') {
    throw new Error('REACT_APP_API_URL must be set to the production backend URL.');
  }
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function mediaUrl(path) {
  if (!path || /^(?:https?:|data:|blob:)/i.test(path)) return path;
  return apiUrl(path);
}

export async function apiRequest(path, options = {}, token) {
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(apiUrl(path), { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) throw new Error(body.message || 'The request could not be completed.');
  return body.data ?? body;
}
