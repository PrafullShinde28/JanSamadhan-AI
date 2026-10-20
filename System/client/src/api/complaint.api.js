import client from './client';

export const complaintApi = {
  create: (formData, onUploadProgress) => client.post('/complaints', formData, { onUploadProgress }),
  startCaptureSession: () => client.post('/citizen/capture-session'),
  citizenList: () => client.get('/citizen/complaints'),
  citizenDetails: (id) => client.get(`/citizen/complaints/${id}`),
  citizenTimeline: (id) => client.get(`/citizen/complaints/${id}/timeline`),
  submitFeedback: (id, payload) => client.post(`/citizen/complaints/${id}/feedback`, payload),
  reopen: (id, payload) => client.post(`/citizen/complaints/${id}/reopen`, payload),
};
