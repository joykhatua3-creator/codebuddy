'use client';

const getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

const request = async (url, options = {}) => {
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) };
  const res = await fetch(`/api${url}`, { ...options, headers });

  if (res.status === 401 && typeof window !== 'undefined') {
    if (
      !window.location.pathname.startsWith('/login') &&
      !window.location.pathname.startsWith('/register') &&
      window.location.pathname !== '/'
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || 'Request failed');
    error.response = { status: res.status, data };
    throw error;
  }
  return { data };
};

export const api = {
  get: (url, config = {}) => {
    let finalUrl = url;
    if (config.params) {
      const searchParams = new URLSearchParams();
      Object.entries(config.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, v);
        }
      });
      const qs = searchParams.toString();
      if (qs) finalUrl += `?${qs}`;
    }
    return request(finalUrl, { method: 'GET' });
  },
  post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
  patch: (url, body) => request(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url) => request(url, { method: 'DELETE' }),
};

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const reviewService = {
  submit: (data) => api.post('/reviews', data),
  getAll: (params) => api.get('/reviews', { params }),
  getById: (id) => api.get(`/reviews/${id}`),
  delete: (id) => api.delete(`/reviews/${id}`),
};

export const progressService = {
  get: () => api.get('/progress'),
};

export const quizService = {
  generate: () => api.post('/quizzes/generate'),
  getById: (id) => api.get(`/quizzes/${id}`),
  submit: (id, data) => api.post(`/quizzes/${id}/submit`, data),
};

export const roadmapService = {
  generate: () => api.post('/roadmap/generate'),
  get: () => api.get('/roadmap'),
  updateStep: (stepId, data) => api.patch(`/roadmap/steps/${stepId}`, data),
};

export const teacherService = {
  getStudents: () => api.get('/teacher/students'),
  getStudentProgress: (id) => api.get(`/teacher/students/${id}/progress`),
};
