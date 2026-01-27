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
    
    // Extract error message from backend response
    const errorMessage = error.response?.data?.detail || 
                        error.response?.data?.message || 
                        error.message || 
                        'An unexpected error occurred';
    
    // Attach extracted message to error object
    error.errorMessage = errorMessage;
    
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
  getAll: (params) => api.get('/patients/', { params }),
  getStats: () => api.get('/patients/stats'),
  search: (query) => api.get('/patients/search', { params: { q: query } }),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients/', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  getVisits: (id) => api.get(`/patients/${id}/visits`),
  getPrescriptions: (id) => api.get(`/patients/${id}/prescriptions`),
};

// OPD API
export const opdAPI = {
  getQueue: (params) => api.get('/opd/queue', { params }),
  getStats: (params) => api.get('/opd/stats', { params }),
  addToQueue: (data) => api.post('/opd/appointments/', data),
  updateStatus: (id, status) => api.put(`/opd/appointments/${id}/status`, { status }),
  updatePosition: (id, newPosition) => api.put(`/opd/appointments/${id}/position`, { new_position: newPosition }),
  getVisitByAppointment: (appointmentId) => api.get(`/opd/appointments/${appointmentId}/visit`),
  getFollowUpsDue: (params) => api.get('/opd/follow-ups-due', { params }),
};

// Chief Complaints API
export const chiefComplaintsAPI = {
  getAll: (activeOnly = true) => api.get('/chief-complaints/', { params: { active_only: activeOnly } }),
  create: (data) => api.post('/chief-complaints/', data),
  update: (id, data) => api.put(`/chief-complaints/${id}`, data),
  delete: (id) => api.delete(`/chief-complaints/${id}`),
};

// Diagnosis Options API
export const diagnosisOptionsAPI = {
  getAll: (activeOnly = true) => api.get('/diagnosis-options/', { params: { active_only: activeOnly } }),
  create: (data) => api.post('/diagnosis-options/', data),
  update: (id, data) => api.put(`/diagnosis-options/${id}`, data),
  delete: (id) => api.delete(`/diagnosis-options/${id}`),
};

// Observation Options API
export const observationOptionsAPI = {
  getAll: (activeOnly = true) => api.get('/observation-options/', { params: { active_only: activeOnly } }),
  create: (data) => api.post('/observation-options/', data),
  update: (id, data) => api.put(`/observation-options/${id}`, data),
  delete: (id) => api.delete(`/observation-options/${id}`),
};

// Test Options API
export const testOptionsAPI = {
  getAll: (activeOnly = true) => api.get('/test-options/', { params: { active_only: activeOnly } }),
  create: (data) => api.post('/test-options/', data),
  update: (id, data) => api.put(`/test-options/${id}`, data),
  delete: (id) => api.delete(`/test-options/${id}`),
};

// Medicine Options API
export const medicineOptionsAPI = {
  getAll: (activeOnly = true) => api.get('/medicine-options/', { params: { active_only: activeOnly } }),
  create: (data) => api.post('/medicine-options/', data),
  update: (id, data) => api.put(`/medicine-options/${id}`, data),
  delete: (id) => api.delete(`/medicine-options/${id}`),
};

// Dosage Options API
export const dosageOptionsAPI = {
  getAll: (activeOnly = true) => api.get('/dosage-options/', { params: { active_only: activeOnly } }),
  create: (data) => api.post('/dosage-options/', data),
  update: (id, data) => api.put(`/dosage-options/${id}`, data),
  delete: (id) => api.delete(`/dosage-options/${id}`),
};

// Duration Options API
export const durationOptionsAPI = {
  getAll: (activeOnly = true) => api.get('/duration-options/', { params: { active_only: activeOnly } }),
  create: (data) => api.post('/duration-options/', data),
  update: (id, data) => api.put(`/duration-options/${id}`, data),
  delete: (id) => api.delete(`/duration-options/${id}`),
};

// Symptom Options API
export const symptomOptionsAPI = {
  getAll: (activeOnly = true) => api.get('/symptom-options/', { params: { active_only: activeOnly } }),
  create: (data) => api.post('/symptom-options/', data),
  update: (id, data) => api.put(`/symptom-options/${id}`, data),
  delete: (id) => api.delete(`/symptom-options/${id}`),
};

// Visits API
export const visitsAPI = {
  getAll: (params) => api.get('/visits/', { params }),
  create: (data) => api.post('/visits/', data),
  getById: (id) => api.get(`/visits/${id}`),
  update: (id, data) => api.put(`/visits/${id}`, data),
  getCollections: (params) => api.get('/visits/collections/summary', { params }),
};

// Invoices API
export const invoicesAPI = {
  getAll: (params) => api.get('/invoices/', { params }),
  create: (data) => api.post('/invoices/', data),
  getById: (id) => api.get(`/invoices/${id}`),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  getStats: (params) => api.get('/invoices/stats/summary', { params }),
};

// Clinic API
export const clinicAPI = {
  getInfo: () => api.get('/clinic/'),
  update: (data) => api.put('/clinic/', data),
  getDoctors: () => api.get('/clinic/doctors'),
  getDoctorProfile: () => api.get('/clinic/doctor-profile'),
  updateDoctorProfile: (data) => api.put('/clinic/doctor-profile', data),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users/'),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats'),
  createSubUser: (data) => api.post('/users/sub-user', data),
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
  updateDoctor: (clinicId, doctorId, data) => api.put(`/admin/clinics/${clinicId}/doctors/${doctorId}`, data),
  removeDoctor: (clinicId, doctorId) => api.delete(`/admin/clinics/${clinicId}/doctors/${doctorId}`),
  setClinicOwner: (clinicId, doctorId) => api.put(`/admin/clinics/${clinicId}/owner`, { doctor_id: doctorId }),
  getAllDoctors: (params) => api.get('/admin/doctors', { params }),
};

// Permissions API
export const permissionsAPI = {
  getClinicUsers: () => api.get('/permissions/clinic-users'),
  getUserPermissions: (userId) => api.get(`/permissions/${userId}`),
  updateUserPermissions: (userId, data) => api.put(`/permissions/${userId}`, data),
  resetToDefaults: (userId) => api.post(`/permissions/${userId}/reset`),
};

export default api;
