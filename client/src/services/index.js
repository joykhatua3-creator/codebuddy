import api from './api';

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
  toggleBookmark: (id) => api.patch(`/reviews/${id}/bookmark`),
};

export const progressService = {
  get: () => api.get('/progress'),
};

export const quizService = {
  generate: () => api.post('/quizzes/generate'),
  submit: (id, data) => api.post(`/quizzes/${id}/submit`, data),
  getAll: () => api.get('/quizzes'),
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
