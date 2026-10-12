import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject JWT token into every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('atlas_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('atlas_token');
      localStorage.removeItem('atlas_user');
      // Redirect to admin login if not already there
      if (window.location.pathname !== '/atlas-admin') {
        window.location.href = '/atlas-admin';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
