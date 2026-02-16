import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (username, password) =>
  api.post('/auth/login', { username, password });
export const getMe = () => api.get('/auth/me');

// Assessments
export const createAssessment = (applicantName) =>
  api.post('/assessments', { applicantName });
export const getAssessments = () => api.get('/assessments');
export const searchAssessments = (params) =>
  api.get('/assessments/search', { params });
export const getAssessment = (id) => api.get(`/assessments/${id}`);
export const savePart = (id, partNum, data) =>
  api.put(`/assessments/${id}/part/${partNum}`, { data });
export const submitAssessment = (id) =>
  api.post(`/assessments/${id}/submit`);
export const approveAssessment = (id, notes) =>
  api.post(`/assessments/${id}/approve`, { notes });
export const rejectAssessment = (id, notes) =>
  api.post(`/assessments/${id}/reject`, { notes });
export const deferAssessment = (id, data) =>
  api.post(`/assessments/${id}/defer`, data);
export const completeDeferral = (id, notes) =>
  api.post(`/assessments/${id}/defer/complete`, { notes });
export const amendAssessment = (id) =>
  api.post(`/assessments/${id}/amend`);
export const overrideAssessment = (id, data) =>
  api.post(`/assessments/${id}/override`, data);
export const getAuditTrail = (id, action) =>
  api.get(`/assessments/${id}/audit`, { params: { action } });
export const deleteAssessment = (id) =>
  api.delete(`/assessments/${id}`);

// Reports
export const getReportSummary = () => api.get('/reports/summary');
export const getReportTrends = () => api.get('/reports/trends');
export const getReportAssessors = () => api.get('/reports/assessors');
export const getReportOverrides = () => api.get('/reports/overrides');

// Notifications
export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) =>
  api.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () =>
  api.put('/notifications/read-all');

export default api;
