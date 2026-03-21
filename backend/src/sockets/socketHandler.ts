import { Server, Socket } from 'socket.io';
import { ambulances } from '../data/ambulances.js';
import { Coordinates } from '../types/index.js';

// How many times faster than real-time the simulation runs
// 15x = a 6-minute drive takes ~24 seconds in the demo
const SPEED_MULTIPLIER = 15;
const TICK_MS = 100; // Emit position every 100ms for smooth animation

interface SimState {
  ambulanceId: string;
  waypoints: Coordinates[];
  waypointIndex: number;
  phase: 'to-user' | 'to-hospital' | 'complete';
  userWaypointCount: number;
  totalDurationSec: number;
  waypointsPerTick: number;
  fractionalIndex: number; // Smooth sub-waypoint tracking
  interval?: ReturnType<typeof setInterval>;
}

const sims = new Map<string, SimState>();

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    socket.on('emergency:simulate', (data: {
      ambulanceId: string;
      userLocation: Coordinates;
      hospitalLocation: Coordinates;
      routeCoords: Coordinates[];
      pickupWaypointCount: number;
      totalDurationMin: number; // Real-world duration in minutes
    }) => {
      const { ambulanceId, routeCoords, pickupWaypointCount, totalDurationMin } = data;

      const existing = sims.get(ambulanceId);
      if (existing?.interval) clearInterval(existing.interval);

      if (!routeCoords || routeCoords.length < 2) {
        console.warn('No route coords, skipping simulation');
        return;
      }

      // Calculate how many waypoints to advance per tick
      const realDurationSec = totalDurationMin * 60;
      const demoDurationSec = realDurationSec / SPEED_MULTIPLIER;
      const totalTicks = (demoDurationSec * 1000) / TICK_MS;
      const waypointsPerTick = Math.max(0.5, routeCoords.length / totalTicks);

      console.log(
        `🚑 Simulation: ${routeCoords.length} waypoints, ` +
        `real=${realDurationSec.toFixed(0)}s, demo=${demoDurationSec.toFixed(0)}s, ` +
        `${waypointsPerTick.toFixed(2)} waypoints/tick`
      );

      const state: SimState = {
        ambulanceId,
        waypoints: routeCoords,
        waypointIndex: 0,
        phase: 'to-user',
        userWaypointCount: pickupWaypointCount,
        totalDurationSec: realDurationSec,
        waypointsPerTick,
        fractionalIndex: 0,
      };

      state.interval = setInterval(() => {
        const amb = ambulances.find(a => a.id === ambulanceId);
        if (!amb) return;

        // Advance fractional index
        state.fractionalIndex += state.waypointsPerTick;
        state.waypointIndex = Math.min(
          Math.floor(state.fractionalIndex),
          state.waypoints.length - 1,
        );

        const pos = state.waypoints[state.waypointIndex];
        amb.location = pos;

        // Check pickup transition
        if (state.phase === 'to-user' && state.waypointIndex >= state.userWaypointCount) {
          state.phase = 'to-hospital';
          io.emit('ambulance:pickup', { ambulanceId });
        }

        // Calculate remaining distance along waypoints (rough km)
        let remaining = 0;
        for (let i = state.waypointIndex; i < state.waypoints.length - 1; i++) {
          const a = state.waypoints[i];
          const b = state.waypoints[i + 1];
          remaining += Math.sqrt((b.lat - a.lat) ** 2 + (b.lng - a.lng) ** 2) * 111;
        }

        // Calculate simulated speed based on progress
        const progress = state.waypointIndex / (state.waypoints.length - 1);
        const baseSpeed = amb.speed;
        // Vary speed slightly for realism: slower in city, faster on open roads
        const speedVariation = 0.8 + Math.sin(progress * Math.PI * 4) * 0.2;

        io.emit('ambulance:position', {
          ambulanceId,
          location: pos,
          phase: state.phase,
          distanceRemaining: Math.round(remaining * 100) / 100,
          speed: Math.round(baseSpeed * speedVariation),
        });

        // Check arrival
        if (state.waypointIndex >= state.waypoints.length - 1) {
          amb.status = 'available';
          if (state.interval) clearInterval(state.interval);
          sims.delete(ambulanceId);
          io.emit('ambulance:arrived', { ambulanceId });
        }
      }, TICK_MS);

      sims.set(ambulanceId, state);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
}
