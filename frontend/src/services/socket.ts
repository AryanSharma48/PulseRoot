import { io } from 'socket.io-client';

export const socket = io('http://localhost:3001', {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
});

socket.on('connect', () => console.log('🔌 Connected to PulseRoute server'));
socket.on('disconnect', () => console.log('❌ Disconnected from server'));
