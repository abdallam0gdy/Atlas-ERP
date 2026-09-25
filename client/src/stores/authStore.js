import { create } from 'zustand';
import api from '../lib/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('atlas_user') || 'null'),
  token: localStorage.getItem('atlas_token') || null,
  isAuthenticated: !!localStorage.getItem('atlas_token'),
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { username, password });
      const { token, refreshToken, user } = data.data;

      localStorage.setItem('atlas_token', token);
      localStorage.setItem('atlas_refresh_token', refreshToken);
      localStorage.setItem('atlas_user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'فشل تسجيل الدخول';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('atlas_token');
    localStorage.removeItem('atlas_refresh_token');
    localStorage.removeItem('atlas_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  updateUser: (updatedUser) => {
    localStorage.setItem('atlas_user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  hasRole: (roleName) => {
    const user = get().user;
    return user?.role?.name === roleName || user?.role?.name === 'SUPER_ADMIN_OWNER';
  },

  hasPermission: (permissionCode) => {
    const user = get().user;
    if (user?.role?.name === 'SUPER_ADMIN_OWNER') return true;
    return user?.permissions?.includes(permissionCode) || false;
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
