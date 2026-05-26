import { io } from 'socket.io-client';
import { API_BASE } from './api';

let socket = null;

export function connectSocket() {
  if (socket && socket.connected) return socket;
  socket = io(API_BASE, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
  });
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
