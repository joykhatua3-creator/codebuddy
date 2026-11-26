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
  getOAuthProviders: () => api.get('/auth/oauth/providers'),
  firebaseOAuth: (data) => api.post('/auth/oauth/firebase', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
  updatePassword: (data) => api.patch('/auth/password', data),
  deleteAccount: () => api.delete('/auth/me'),
};

export const reviewService = {
  submit: (data) => api.post('/reviews', data),
  retry: (id) => api.post(`/reviews/${id}/retry`),
  getAll: (params) => api.get('/reviews', { params }),
  getById: (id) => api.get(`/reviews/${id}`),
  update: (id, data) => api.patch(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  toggleBookmark: (id) => api.patch(`/reviews/${id}/bookmark`),

  /**
   * Stream a review using Server-Sent Events (SSE)
   * Dispatches events: progress, error, complete
   */
  streamReview: async ({ language, code, assignmentId }, { onProgress, onComplete, onError }) => {
    const token = localStorage.getItem('token');
    const SSE_TIMEOUT_MS = 45000;
    const controller = new AbortController();
    let timeoutId = null;

    const resetIdleTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        controller.abort();
      }, SSE_TIMEOUT_MS);
    };

    resetIdleTimeout();

    try {
      const response = await fetch(`${baseURL}/reviews/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({ language, code, ...(assignmentId ? { assignmentId } : {}) }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = new Error(errorData.message || `HTTP error ${response.status}`);
        err.status = response.status;
        throw err;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finished = false;

      const processBlock = (block) => {
        if (!block.trim()) return;
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
              finished = true;
              onComplete(parsed);
            } else if (eventType === 'error') {
              finished = true;
              if (onError) onError(new Error(parsed.message || 'Stream error'));
            }
          } catch (err) {
            console.error('SSE JSON parse error:', err);
          }
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        resetIdleTimeout();
        if (done) {
          buffer += decoder.decode();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, '\n');
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // Keep trailing incomplete chunk

        for (const block of lines) {
          processBlock(block);
        }
      }

      // Flush any trailing SSE block when stream closes without final \n\n
      if (buffer.trim()) {
        for (const block of buffer.replace(/\r\n/g, '\n').split('\n\n')) {
          processBlock(block);
        }
      }

      if (!finished && onError) {
        onError(new Error('Stream ended before completion'));
      }
    } catch (err) {
      const normalizedErr =
        err?.name === 'AbortError'
          ? Object.assign(new Error('AI request timed out after 45s'), { status: 408 })
          : err;
      if (onError) onError(normalizedErr);
      else throw normalizedErr;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  },
};

export const progressService = {
  get: () => api.get('/progress'),
};

export const quizService = {
  generate: (topic) => api.post('/quizzes/generate', topic ? { topic } : {}),
  getAll: () => api.get('/quizzes'),
  getById: (id) => api.get(`/quizzes/${id}`),
  submit: (id, data) => api.post(`/quizzes/${id}/submit`, data),
  delete: (id) => api.delete(`/quizzes/${id}`),
};

export const roadmapService = {
  generate: (data = {}) => api.post('/roadmap/generate', data),
  get: (roadmapId) => api.get('/roadmap', { params: roadmapId ? { roadmapId } : {} }),
  updateStep: (stepId, data) => api.patch(`/roadmap/steps/${stepId}`, data),
  resetProgress: (roadmapId) => api.patch(`/roadmap/${roadmapId}/reset`),
  delete: (roadmapId) => api.delete(roadmapId ? `/roadmap/${roadmapId}` : '/roadmap'),
};

export const teacherService = {
  getStudents: () => api.get('/teacher/students'),
  getStudentProgress: (id) => api.get(`/teacher/students/${id}/progress`),
  exportCsv: () => api.get('/teacher/students/export', { responseType: 'blob' }),
  addReviewFeedback: (reviewId, data) => api.patch(`/teacher/reviews/${reviewId}/feedback`, data),
};

export const assignmentService = {
  getAll: () => api.get('/assignments'),
  create: (data) => api.post('/assignments', data),
  getSubmissions: (id) => api.get(`/assignments/${id}/submissions`),
  delete: (id) => api.delete(`/assignments/${id}`),
};
