import axios from 'axios';
import { API_URL } from '../config'; 

const api = axios.create({
  baseURL: `${API_URL}/api/`,
  timeout: 15000, 
  headers: {
    'Content-Type': 'application/json',
    accept: 'application/json',
  },
});

// REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    // Matches the key used in Login.jsx and App.jsx
    const token = localStorage.getItem('myBlogToken');
    
    if (token) {
      // === CRITICAL FIX ===
      // Django DRF default auth uses the keyword 'Token', NOT 'Bearer'
      // 'Bearer' is for JWT. You are using Standard Tokens.
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
        
        // No reload if the error came from the LOGIN endpoints.
        // We added 'api-token-auth' to this list so wrong passwords don't redirect you.
        if (
            originalRequest.url.includes('/login/') || 
            originalRequest.url.includes('/token/') ||
            originalRequest.url.includes('api-token-auth') // <--- ADDED THIS
        ) {
            return Promise.reject(error);
        }

        // Clear credentials
        localStorage.removeItem('myBlogToken');
        localStorage.removeItem('myBlogUser');
        
        // Redirect to login
        window.location.href = '/login'; 
    }
    
    return Promise.reject(error);
  }
);

export default api;