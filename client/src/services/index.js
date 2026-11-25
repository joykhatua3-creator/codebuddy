import api, { API_BASE_URL } from './api';

const baseURL = API_BASE_URL;

// Silently pre-warm the Render backend on app load so cold-starts finish before user submits forms
let warmedUp = false;
export const warmUpBackend = () => {
  if (warmedUp) return;
  warmedUp = true;
  fetch(`${baseURL}/health`, { method: 'GET', mode: 'cors' }).catch(() => {});
};

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  demoLogin: (role = 'student') => api.post('/auth/demo', { role }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
  updatePassword: (data) => api.patch('/auth/password', data),
  deleteAccount: () => api.delete('/auth/me'),
};

export const reviewService = {
  submit: (data) => api.post('/reviews', data),
  getAll: (params) => api.get('/reviews', { params }),
  getById: (id) => api.get(`/reviews/${id}`),
  update: (id, data) => api.patch(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  toggleBookmark: (id) => api.patch(`/reviews/${id}/bookmark`),

  /**
   * Stream a review using Server-Sent Events (SSE)
   * Dispatches events: progress, error, complete
   */
  streamReview: async ({ language, code }, { onProgress, onComplete, onError }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${baseURL}/reviews/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ language, code }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // Keep trailing incomplete chunk

        for (const block of lines) {
          if (!block.trim()) continue;
          let eventType = 'message';
          let dataStr = '';

          const parts = block.split('\n');
          for (const line of parts) {
            if (line.startsWith('event: ')) {
              eventType = line.replace('event: ', '').trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.replace('data: ', '').trim();
            }
          }

          if (dataStr) {
            try {
              const parsed = JSON.parse(dataStr);
              if ((eventType === 'progress' || eventType === 'status') && onProgress) {
                onProgress(parsed);
              } else if (eventType === 'complete' && onComplete) {
                onComplete(parsed);
              } else if (eventType === 'error') {
                if (onError) onError(new Error(parsed.message || 'Stream error'));
              }
            } catch (err) {
              console.error('SSE JSON parse error:', err);
            }
          }
        }
      }
    } catch (err) {
      if (onError) onError(err);
      else throw err;
    }
  },
};

export const progressService = {
  get: () => api.get('/progress'),
};

export const quizService = {
  generate: () => api.post('/quizzes/generate'),
  getAll: () => api.get('/quizzes'),
  getById: (id) => api.get(`/quizzes/${id}`),
  submit: (id, data) => api.post(`/quizzes/${id}/submit`, data),
  delete: (id) => api.delete(`/quizzes/${id}`),
};

export const roadmapService = {
  generate: () => api.post('/roadmap/generate'),
  get: () => api.get('/roadmap'),
  updateStep: (stepId, data) => api.patch(`/roadmap/steps/${stepId}`, data),
  delete: () => api.delete('/roadmap'),
};

export const teacherService = {
  getStudents: () => api.get('/teacher/students'),
  getStudentProgress: (id) => api.get(`/teacher/students/${id}/progress`),
};
