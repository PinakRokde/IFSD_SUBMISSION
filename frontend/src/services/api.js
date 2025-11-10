import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export const signup = (payload, config = {}) => api.post('/auth/signup', payload, config);
export const login = (payload, config = {}) => api.post('/auth/login', payload, config);
export const fetchTimers = (config = {}) => api.get('/auth/timers', config);
export const searchTimers = (query, config = {}) =>
  api.get('/auth/timers/search', { params: { q: query }, ...config });
export const createTimer = (payload, config = {}) => api.post('/auth/timers', payload, config);
export const updateTimer = (timerId, payload, config = {}) =>
  api.put(`/auth/timers/${timerId}`, payload, config);
export const deleteTimer = (timerId, config = {}) => api.delete(`/auth/timers/${timerId}`, config);

export default api;
