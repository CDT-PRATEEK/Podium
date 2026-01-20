import api from './api';

export const authService = {
  // 1. LOGIN
  login: async (username, password) => {
    // Django DRF Token Endpoint
    const response = await api.post('api-token-auth/', { username, password });
    return response.data; // Returns { token: "..." }
  },

  // 2. REGISTER
  register: async (userData) => {
    // userData = { username, email, password }
    const response = await api.post('register/', userData);
    return response.data;
  },

  // 3. GET PROFILE
  getProfile: async () => {
    const response = await api.get('profile/');
    return response.data;
  },

  deleteAccount: async () => {
        const response = await api.post('delete-account/');
        return response.data;
    }


};