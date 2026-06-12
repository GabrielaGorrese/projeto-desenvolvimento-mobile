import { io } from 'socket.io-client';
import { getApiBaseUrl } from './apiConfig';

let socket = null;
const subscriptions = new Set();

const SOCKET_OPTS = {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1500,
  reconnectionDelayMax: 10000,
  timeout: 10000,
};

export function connectSocket() {
  if (socket) return socket;

  socket = io(getApiBaseUrl(), SOCKET_OPTS);

  subscriptions.forEach(({ event, handler }) => socket.on(event, handler));

  if (__DEV__) {
    socket.on('connect',       () => console.log('[socket] conectado', socket.id));
    socket.on('disconnect',    (r) => console.log('[socket] desconectado', r));
    socket.on('connect_error', (e) => console.warn('[socket] erro de conexão', e.message));
  }

  return socket;
}

export function getSocket() {
  return socket || connectSocket();
}

export function onSocket(event, handler) {
  const sub = { event, handler };
  const s = connectSocket();
  subscriptions.add(sub);
  s.on(event, handler);
  return () => {
    subscriptions.delete(sub);
    if (socket) socket.off(event, handler);
  };
}

export function disconnectSocket() {
  if (socket) {
    subscriptions.forEach(({ event, handler }) => socket.off(event, handler));
    socket.disconnect();
    socket = null;
  }
}

export function reconnectSocket() {
  disconnectSocket();
  return connectSocket();
}
