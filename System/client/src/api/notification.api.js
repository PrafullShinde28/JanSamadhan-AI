import client from './client';

export const notificationApi = {
  list: () => client.get('/notifications'),
  unreadCount: () => client.get('/notifications/unread-count'),
  markRead: (id) => client.patch(`/notifications/${id}/read`),
  markAllRead: () => client.patch('/notifications/read-all'),
  remove: (id) => client.delete(`/notifications/${id}`),
  removeAll: () => client.delete('/notifications'),
};
