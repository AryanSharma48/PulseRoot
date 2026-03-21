import { Server, Socket } from 'socket.io';
import { ambulances } from '../data/ambulances.js';
import { Coordinates } from '../types/index.js';

interface SimState {
  ambulanceId: string;
  target: Coordinates;
  hospital: Coordinates;
  phase: 'to-user' | 'to-hospital' | 'complete';
  interval?: ReturnType<typeof setInterval>;
}

const sims = new Map<string, SimState>();

function moveToward(current: Coordinates, target: Coordinates, step = 0.0008) {
  const dLat = target.lat - current.lat;
  const dLng = target.lng - current.lng;
  const dist = Math.sqrt(dLat ** 2 + dLng ** 2);
  if (dist < step) return { position: { ...target }, arrived: true };
  const r = step / dist;
  return {
    position: { lat: current.lat + dLat * r, lng: current.lng + dLng * r },
    arrived: false,
  };
}

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    socket.on('emergency:simulate', (data: {
      ambulanceId: string;
      userLocation: Coordinates;
      hospitalLocation: Coordinates;
    }) => {
      const { ambulanceId, userLocation, hospitalLocation } = data;

      const existing = sims.get(ambulanceId);
      if (existing?.interval) clearInterval(existing.interval);

      const state: SimState = {
        ambulanceId,
        target: userLocation,
        hospital: hospitalLocation,
        phase: 'to-user',
      };

      state.interval = setInterval(() => {
        const amb = ambulances.find(a => a.id === ambulanceId);
        if (!amb) return;

        const dest = state.phase === 'to-user' ? state.target : state.hospital;
        const { position, arrived } = moveToward(amb.location, dest);
        amb.location = position;

        const distDeg = Math.sqrt((dest.lat - position.lat) ** 2 + (dest.lng - position.lng) ** 2);

        io.emit('ambulance:position', {
          ambulanceId,
          location: position,
          phase: state.phase,
          distanceRemaining: Math.round(distDeg * 111 * 100) / 100,
          speed: amb.speed,
        });

        if (arrived) {
          if (state.phase === 'to-user') {
            state.phase = 'to-hospital';
            io.emit('ambulance:pickup', { ambulanceId });
          } else {
            amb.status = 'available';
            if (state.interval) clearInterval(state.interval);
            sims.delete(ambulanceId);
            io.emit('ambulance:arrived', { ambulanceId });
          }
        }
      }, 500);

      sims.set(ambulanceId, state);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
}
