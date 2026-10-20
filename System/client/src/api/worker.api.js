import client from './client';

export const workerApi = {
  dashboard: () => client.get('/worker/dashboard'),
  complaints: (status) => client.get('/worker/complaints', { params: status ? { status } : undefined }),
  details: (id) => client.get(`/worker/complaints/${id}`),
  timeline: (id) => client.get(`/worker/complaints/${id}/timeline`),
  accept: (id) => client.post(`/worker/complaints/${id}/accept`),
  reject: (id, payload) => client.post(`/worker/complaints/${id}/reject`, payload),
  start: (id) => client.post(`/worker/complaints/${id}/start`),
  reach: (id, payload) => client.post(`/worker/complaints/${id}/reach`, payload),
  progress: (id, formData) => client.post(`/worker/complaints/${id}/progress`, formData),
  resolve: (id, formData) => client.post(`/worker/complaints/${id}/resolve`, formData),
  updateDutyStatus: (availability) => client.patch('/worker/duty-status', { availability }),
};
