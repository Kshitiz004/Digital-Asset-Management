import axios from 'axios';

/**
 * API Service - Handles all HTTP requests to backend
 * Configuration: Base URL and default headers
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * Authentication API calls
 */
export const authAPI = {
  register: (data: { email: string; name: string; password: string; roleName?: string }) =>
    apiClient.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  
  getProfile: () => apiClient.get('/auth/profile'),
};

/**
 * Assets API calls
 */
export const assetsAPI = {
  upload: (file: File, tags?: string, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (tags) formData.append('tags', tags);
    if (description) formData.append('description', description);
    
    return apiClient.post('/assets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  getAll: () => apiClient.get('/assets'),
  
  getAllAssets: () => apiClient.get('/assets/all'), // Admin only
  
  getById: (id: string) => apiClient.get(`/assets/${id}`),
  
  getDownloadUrl: (id: string) => apiClient.get(`/assets/${id}/download`),
  
  update: (id: string, data: { tags?: string; description?: string }) =>
    apiClient.put(`/assets/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/assets/${id}`),
  
  share: (id: string) => apiClient.post(`/assets/${id}/share`),
  
  getShared: (id: string) => apiClient.get(`/assets/shared/${id}`),
};

/**
 * Analytics API calls
 */
export const analyticsAPI = {
  getAdmin: () => apiClient.get('/analytics/admin'),
  
  getUser: () => apiClient.get('/analytics/user'),
};

/**
 * Users API calls (Admin only)
 */
export const usersAPI = {
  getAll: () => apiClient.get('/users'),
  
  create: (data: { email: string; name: string; password: string; roleName?: string }) =>
    apiClient.post('/users', data),
  
  updateRole: (id: string, roleName: string) =>
    apiClient.put(`/users/${id}/role`, { roleName }),
  
  delete: (id: string) => apiClient.delete(`/users/${id}`),
};

export default apiClient;


