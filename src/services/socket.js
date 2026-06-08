import { io } from 'socket.io-client';
import { getApiBaseUrl } from './apiConfig';

let socket = null;

export function connectSocket() {
  if (socket && socket.connected) return socket;

  socket = io(getApiBaseUrl(), {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });

  if (__DEV__) {
    socket.on('connect',    () => console.log('[socket] conectado', socket.id));
    socket.on('disconnect', (r) => console.log('[socket] desconectado', r));
    socket.on('connect_error', (e) => console.warn('[socket] erro de conexão', e.message));
  }

  return socket;
}

export function getSocket() {
  if (!socket) return connectSocket();
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Reconecta usando a URL atual — chamado após o usuário trocar a config da API.
export function reconnectSocket() {
  disconnectSocket();
  return connectSocket();
}
