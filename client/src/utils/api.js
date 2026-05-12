import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('fitbot_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url || '';
    const isAuthRoute = url.includes('/auth/');
    // Only force-logout on 401 for non-auth routes (token expired / revoked).
    // Never redirect on a failed login attempt — let the page handle it.
    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('fitbot_token');
      localStorage.removeItem('fitbot_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
