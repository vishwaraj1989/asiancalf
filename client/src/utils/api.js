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
