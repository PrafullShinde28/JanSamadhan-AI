import client from './client';

export const adminApi = {
  dashboard: () => client.get('/admin/dashboard/analytics'),
  complaints: (params) => client.get('/admin/complaints', { params }),
  details: (id) => client.get(`/admin/complaints/${id}`),
  overridePriority: (id, payload) => client.post(`/admin/complaints/${id}/override-priority`, payload),
  overrideDepartment: (id, payload) => client.post(`/admin/complaints/${id}/override-department`, payload),
  reassignWorker: (id, payload) => client.post(`/admin/complaints/${id}/reassign-worker`, payload),
  overrideResolution: (id, payload) => client.post(`/admin/complaints/${id}/override-resolution`, payload),
  close: (id, payload) => client.post(`/admin/complaints/${id}/close`, payload),

  // Staff Management
  getStats: () => client.get('/admin/workers/stats'),
  inviteWorker: (payload) => client.post('/admin/workers/invite', payload),
  inviteAdmin: (payload) => client.post('/admin/admins/invite', payload),
  getInvitations: (params) => client.get('/admin/invitations', { params }),
  resendInvitation: (id) => client.post(`/admin/invitations/${id}/resend`),
  revokeInvitation: (id) => client.post(`/admin/invitations/${id}/revoke`),
  enrollCitizen: (payload) => client.post('/admin/workers/enroll', payload),
  getWorkers: () => client.get('/admin/workers'),
  getWorkerDetails: (id) => client.get(`/admin/workers/${id}`),
  updateWorker: (id, payload) => client.put(`/admin/workers/${id}`, payload),
  getAdmins: () => client.get('/admin/admins'),
  searchCitizens: (query) => client.get('/admin/citizens/search', { params: { query } }),

  // Departments
  getDepartments: (params) => client.get('/admin/departments', { params }),
  addDepartment: (payload) => client.post('/admin/departments', payload),
};
