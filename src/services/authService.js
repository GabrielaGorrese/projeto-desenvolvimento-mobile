import api from './api';

export async function loginRequest(username, password) {
  const { data } = await api.post('/auth/login', { username, password });
  return data;
}

// Auto-cadastro público (não exige login). role: 'attendant' (default) ou 'manager'.
export async function registerRequest({ username, password, role }) {
  const { data } = await api.post('/auth/users/attendant', { username, password, role });
  return data;
}

export async function me() {
  const { data } = await api.get('/me');
  return data;
}
