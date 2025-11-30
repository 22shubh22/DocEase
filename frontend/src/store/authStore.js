import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });

    // MOCK MODE - Set to false when backend is ready
    const MOCK_MODE = true;

    if (MOCK_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock login - accepts any email/password
      const mockUser = {
        id: '1',
        email: credentials.email,
        fullName: credentials.email.includes('doctor') ? 'Dr. John Smith' : 'Sarah Johnson',
        role: credentials.email.includes('doctor') ? 'DOCTOR' : 'ASSISTANT',
        clinic: {
          id: '1',
          name: 'City Health Clinic'
        }
      };

      const mockToken = 'mock-jwt-token-' + Date.now();

      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      set({ user: mockUser, token: mockToken, isAuthenticated: true, isLoading: false });
      return { success: true };
    }

    // Real API call (when backend is ready)
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    set({ user: userData });
    localStorage.setItem('user', JSON.stringify(userData));
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
