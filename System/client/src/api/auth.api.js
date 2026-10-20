import client from './client';

export const authApi = {
  sync: (profile) => client.post('/auth/sync', profile),
  me: () => client.get('/auth/me'),
};
