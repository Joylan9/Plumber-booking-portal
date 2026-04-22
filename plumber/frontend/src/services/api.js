import axios from 'axios';
import { normalizeApiError } from './apiError';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT from localStorage
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const requestUrl = err.config?.url || '';
    const isAuthRequest = requestUrl.startsWith('/api/auth/');

    if (err.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(normalizeApiError(err));
  }
);

export default api;
