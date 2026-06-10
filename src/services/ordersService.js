import api from './api';

export async function fetchOpenOrders({ page = 1, limit = 50 } = {}) {
  const { data } = await api.get('/orders', { params: { page, limit } });
  return data;
}

export async function fetchClosedOrders({ page = 1, limit = 50, date } = {}) {
  const { data } = await api.get('/orders/closed', { params: { page, limit, date } });
  return data;
}

export async function fetchOrder(id) {
  const { data } = await api.get(`/orders/${id}`);
  return data.order;
}

export async function createOrder({ label, table_id, people, items = [], daily_number }) {
  const { data } = await api.post('/orders', { label, table_id, people, items, daily_number });
  return data.order;
}

// Sugestão do próximo número da comanda (contador atual + 1).
export async function fetchNextOrderNumber() {
  const { data } = await api.get('/orders/next-number');
  return data.next_number;
}

export async function updateOrder(id, payload) {
  const { data } = await api.patch(`/orders/${id}`, payload);
  return data.order;
}

// Marca itens como entregues (array de item_id).
export async function deliverItems(id, itemIds) {
  const { data } = await api.patch(`/orders/${id}`, { deliver_items: itemIds });
  return data.order;
}

// Volta itens para pendente (array de item_id).
export async function undeliverItems(id, itemIds) {
  const { data } = await api.patch(`/orders/${id}`, { undeliver_items: itemIds });
  return data.order;
}

// Marca todos os itens da comanda como entregues.
export async function deliverAll(id) {
  const { data } = await api.patch(`/orders/${id}`, { deliver_all: true });
  return data.order;
}

export async function closeOrder(id) {
  const { data } = await api.post(`/orders/${id}/close`);
  return data.order;
}

export async function reopenOrder(id) {
  const { data } = await api.post(`/orders/${id}/reopen`);
  return data.order;
}

export async function deleteOrder(id) {
  const { data } = await api.delete(`/orders/${id}`);
  return data;
}

// "Fechar caixa": zera a numeração visível das comandas (próxima volta a nº 1).
// Somente gerente. Backend recusa (409) se houver comandas abertas.
export async function resetOrderSequence() {
  const { data } = await api.post('/orders/sequence/reset');
  return data;
}
