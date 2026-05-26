import api from './api';

export async function fetchTables() {
  const { data } = await api.get('/tables');
  return data.tables;
}

export async function createTable(label) {
  const { data } = await api.post('/tables', { label });
  return data.table;
}

export async function updateTable(id, label) {
  const { data } = await api.patch(`/tables/${id}`, { label });
  return data.table;
}

export async function toggleTable(id) {
  const { data } = await api.patch(`/tables/${id}/toggle`);
  return data.table;
}

export async function deleteTable(id) {
  const { data } = await api.delete(`/tables/${id}`);
  return data;
}
