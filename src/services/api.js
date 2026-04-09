import axios from 'axios';
import { confirmToast } from '../utils/confirmToast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

// Token storage helpers
function getAccessToken() {
  return localStorage.getItem('accessToken');
}
function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}
function setAccessToken(token) {
  if (token) localStorage.setItem('accessToken', token);
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token refresh queue management
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

let hasShownSessionWarning = false;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response && error.response.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const rt = getRefreshToken();
        if (!rt) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken: rt });
        setAccessToken(data.accessToken);
        onRefreshed(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        hasShownSessionWarning = false; // Reset warning flag on successful refresh
        return api(original);
      } catch (e) {
        // Session expired - show warning before redirect
        if (!hasShownSessionWarning) {
          hasShownSessionWarning = true;
          // Use confirmToast for a better UI experience
          const shouldRedirect = await confirmToast(
            'Your session has expired. You will be redirected to the login page.',
            { confirmLabel: 'Go to Login', cancelLabel: 'Wait', variant: 'warning' }
          );
          
          if (shouldRedirect) {
            localStorage.clear();
            setTimeout(() => {
              window.location.href = '/login?session=expired';
            }, 300);
          }
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE };
