import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
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

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Patients API
export const patientsAPI = {
  getAll: (params) => api.get('/patients', { params }),
  search: (query) => api.get('/patients/search', { params: { q: query } }),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  getVisits: (id) => api.get(`/patients/${id}/visits`),
  getPrescriptions: (id) => api.get(`/patients/${id}/prescriptions`),
};

// OPD API
export const opdAPI = {
  getQueue: () => api.get('/opd/queue'),
  getStats: () => api.get('/opd/stats'),
  addToQueue: (data) => api.post('/opd/appointments', data),
  updateStatus: (id, status) => api.put(`/opd/appointments/${id}/status`, { status }),
};

// Visits API
export const visitsAPI = {
  create: (data) => api.post('/visits', data),
  getById: (id) => api.get(`/visits/${id}`),
  update: (id, data) => api.put(`/visits/${id}`, data),
};

// Prescriptions API
export const prescriptionsAPI = {
  create: (data) => api.post('/prescriptions', data),
  getById: (id) => api.get(`/prescriptions/${id}`),
  downloadPDF: (id) => api.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' }),
};

// Invoices API
export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  create: (data) => api.post('/invoices', data),
  getById: (id) => api.get(`/invoices/${id}`),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  getStats: (params) => api.get('/invoices/stats/summary', { params }),
};

// Clinic API
export const clinicAPI = {
  getInfo: () => api.get('/clinic'),
  update: (data) => api.put('/clinic', data),
  getDoctorProfile: () => api.get('/clinic/doctor-profile'),
  updateDoctorProfile: (data) => api.put('/clinic/doctor-profile', data),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getClinics: () => api.get('/admin/clinics'),
  createClinic: (data) => api.post('/admin/clinics', data),
  getClinic: (id) => api.get(`/admin/clinics/${id}`),
  updateClinic: (id, data) => api.put(`/admin/clinics/${id}`, data),
  deleteClinic: (id) => api.delete(`/admin/clinics/${id}`),
  getClinicDoctors: (clinicId) => api.get(`/admin/clinics/${clinicId}/doctors`),
  addDoctor: (clinicId, data) => api.post(`/admin/clinics/${clinicId}/doctors`, data),
  removeDoctor: (clinicId, doctorId) => api.delete(`/admin/clinics/${clinicId}/doctors/${doctorId}`),
};

export default api;
