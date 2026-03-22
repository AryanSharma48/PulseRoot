import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
});

socket.on('connect', () => console.log('🔌 Connected to PulseRoute server'));
socket.on('disconnect', () => console.log('❌ Disconnected from server'));
