import { io } from 'socket.io-client';
import { getToken } from './api.js';

let socket = null;

export function getSocket() {
  if (socket && socket.connected) return socket;
  if (socket) return socket;
  socket = io('/', {
    autoConnect: true,
    auth: { token: getToken() },
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
