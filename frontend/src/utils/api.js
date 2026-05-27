// src/utils/api.js — Centralized API client with auth headers
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rw_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rw_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  login:    (data)   => api.post('/auth/login', data),
  register: (data)   => api.post('/auth/register', data),
  me:       ()       => api.get('/auth/me'),
};

// ── Issues ────────────────────────────────────────────────
export const issuesAPI = {
  getAll:       (params)    => api.get('/issues', { params }),
  getById:      (id)        => api.get(`/issues/${id}`),
  getStats:     ()          => api.get('/issues/stats'),
  create:       (formData)  => api.post('/issues', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateStatus: (id, status) => api.patch(`/issues/${id}/status`, { status }),
  delete:       (id)        => api.delete(`/issues/${id}`),
};

// ── Users ─────────────────────────────────────────────────
export const usersAPI = {
  me:        () => api.get('/users/me'),
  myReports: () => api.get('/users/me/reports'),
};

export default api;
