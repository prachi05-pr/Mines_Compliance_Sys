import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('coal_gov_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 Unauthorized to trigger clean logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Token invalid or expired
      localStorage.removeItem('coal_gov_token');
      localStorage.removeItem('coal_gov_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Typed API helper services
export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  signup: (data: any) => api.post('/auth/signup', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const minesApi = {
  getAll: () => api.get('/mines'),
  getById: (id: string) => api.get(`/mines/${id}`),
  create: (data: any) => api.post('/mines', data),
  update: (id: string, data: any) => api.put(`/mines/${id}`, data),
};

export const complianceApi = {
  getAll: () => api.get('/compliance'),
  getByMine: (mineId: string) => api.get(`/compliance/mine/${mineId}`),
  create: (data: any) => api.post('/compliance', data),
  update: (id: string, data: any) => api.put(`/compliance/${id}`, data),
};

export const contractorsApi = {
  getAll: () => api.get('/contractors'),
  getById: (id: string) => api.get(`/contractors/${id}`),
  create: (data: any) => api.post('/contractors', data),
  update: (id: string, data: any) => api.put(`/contractors/${id}`, data),
};

export const inspectionsApi = {
  getAll: () => api.get('/inspections'),
  getById: (id: string) => api.get(`/inspections/${id}`),
  create: (data: any) => api.post('/inspections', data),
  update: (id: string, data: any) => api.put(`/inspections/${id}`, data),
  analyze: (id: string) => api.post(`/inspections/${id}/analyze`),
};

export const violationsApi = {
  getAll: (params?: any) => api.get('/violations', { params }),
  getById: (id: string) => api.get(`/violations/${id}`),
  confirm: (id: string) => api.put(`/violations/${id}/confirm`),
  reject: (id: string) => api.put(`/violations/${id}/reject`),
};

export const alertsApi = {
  getAll: (params?: any) => api.get('/alerts', { params }),
  getById: (id: string) => api.get(`/alerts/${id}`),
  markAsRead: (id: string) => api.put(`/alerts/${id}/read`),
  markAllAsRead: () => api.put('/alerts/read-all'),
};

export const dashboardApi = {
  getOfficer: () => api.get('/dashboard/officer'),
  getCorporate: () => api.get('/dashboard/corporate'),
};

export const systemApi = {
  getHealth: () => api.get('/health'),
  getDbStatus: () => api.get('/db-status'),
  seedDatabase: () => api.post('/seed'),
};
