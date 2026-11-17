import api from './api';

export const createReview = (data) => api.post('/reviews', data).then((r) => r.data.review);
export const listReviews = (page = 1) => api.get('/reviews', { params: { page } }).then((r) => r.data);
export const getReview = (id) => api.get(`/reviews/${id}`).then((r) => r.data.review);
export const deleteReview = (id) => api.delete(`/reviews/${id}`).then((r) => r.data);
