import { Server, Socket } from 'socket.io';
import { ambulances, ambulanceHomeBases } from '../data/ambulances.js';
import { Coordinates } from '../types/index.js';
import { fetchRoadRoute } from '../services/routeService.js';

// Demo speed: 15x means a 6-minute drive takes ~24 seconds
const SPEED_MULTIPLIER = 15;
const RETREAT_SPEED_MULTIPLIER = 10; // Slower retreat (more relaxed)
const TICK_MS = 100;

interface SimState {
  ambulanceId: string;
  waypoints: Coordinates[];
  phase: 'to-user' | 'to-hospital' | 'complete' | 'returning';
  userWaypointCount: number;
  waypointsPerTick: number;
  fractionalIndex: number;
  interval?: ReturnType<typeof setInterval>;
}

// Active emergency simulations
const sims = new Map<string, SimState>();
// Active retreat simulations (separate so emergency can cancel them)
const retreats = new Map<string, ReturnType<typeof setInterval>>();

function lerp(a: Coordinates, b: Coordinates, t: number): Coordinates {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

function interpolateRoute(from: Coordinates, to: Coordinates, steps = 40): Coordinates[] {
  const route: Coordinates[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    route.push({
      lat: from.lat + (to.lat - from.lat) * t,
      lng: from.lng + (to.lng - from.lng) * t,
    });
  }
  return route;
}

/**
 * Start a retreat simulation — ambulance slowly returns to home base
 */
async function startRetreat(io: Server, ambulanceId: string) {
  const amb = ambulances.find(a => a.id === ambulanceId);
  const home = ambulanceHomeBases.get(ambulanceId);
  if (!amb || !home) return;

  // If already at home, skip
  const dist = Math.abs(amb.location.lat - home.lat) + Math.abs(amb.location.lng - home.lng);
  if (dist < 0.0001) return;

  // Try to get road route back, fallback to straight line
  let waypoints: Coordinates[];
  let durationSec: number;
  try {
    const route = await fetchRoadRoute(amb.location, home);
    waypoints = route.coords;
    durationSec = route.durationMin * 60;
  } catch {
    waypoints = interpolateRoute(amb.location, home, 40);
    durationSec = 120; // ~2 min fallback
  }

  if (waypoints.length < 2) return;

  const demoDurationSec = durationSec / RETREAT_SPEED_MULTIPLIER;
  const totalTicks = (demoDurationSec * 1000) / TICK_MS;
  const waypointsPerTick = Math.max(0.1, (waypoints.length - 1) / totalTicks);

  let fractionalIndex = 0;

  console.log(`🔙 ${ambulanceId} retreating to base (${waypoints.length} pts, ${demoDurationSec.toFixed(0)}s)`);

  const interval = setInterval(() => {
    fractionalIndex += waypointsPerTick;
    const maxIdx = waypoints.length - 1;

    if (fractionalIndex >= maxIdx) {
      // Arrived home
      amb.location = { lat: home.lat, lng: home.lng };
      io.emit('ambulance:retreat', {
        ambulanceId,
        location: amb.location,
        phase: 'returning',
        distanceRemaining: 0,
        speed: 0,
      });
      clearInterval(interval);
      retreats.delete(ambulanceId);
      console.log(`🏠 ${ambulanceId} back at base`);
      return;
    }

    const floorIdx = Math.floor(fractionalIndex);
    const t = fractionalIndex - floorIdx;
    const pos = lerp(waypoints[floorIdx], waypoints[Math.min(floorIdx + 1, maxIdx)], t);
    amb.location = pos;

    io.emit('ambulance:position', {
      ambulanceId,
      location: pos,
      phase: 'returning',
      distanceRemaining: 0,
      speed: Math.round(amb.speed * 0.6), // Slower return speed
    });
  }, TICK_MS);

  retreats.set(ambulanceId, interval);
}

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    socket.on('emergency:simulate', (data: {
      ambulanceId: string;
      userLocation: Coordinates;
      hospitalLocation: Coordinates;
      routeCoords: Coordinates[];
      pickupWaypointCount: number;
      totalDurationMin: number;
    }) => {
      const { ambulanceId, routeCoords, pickupWaypointCount, totalDurationMin } = data;

      // Cancel any existing emergency sim
      const existing = sims.get(ambulanceId);
      if (existing?.interval) clearInterval(existing.interval);
      sims.delete(ambulanceId);

      // Cancel any retreat in progress
      const retreatInterval = retreats.get(ambulanceId);
      if (retreatInterval) {
        clearInterval(retreatInterval);
        retreats.delete(ambulanceId);
        console.log(`⚡ ${ambulanceId} retreat cancelled — new emergency!`);
      }

      if (!routeCoords || routeCoords.length < 2) {
        console.warn('No route coords, skipping simulation');
        return;
      }

      const realDurationSec = totalDurationMin * 60;
      const demoDurationSec = realDurationSec / SPEED_MULTIPLIER;
      const totalTicks = (demoDurationSec * 1000) / TICK_MS;
      const waypointsPerTick = Math.max(0.1, (routeCoords.length - 1) / totalTicks);

      console.log(
        `🚑 Sim: ${routeCoords.length} pts, ` +
        `real=${realDurationSec.toFixed(0)}s, demo=${demoDurationSec.toFixed(0)}s, ` +
        `${waypointsPerTick.toFixed(3)} pts/tick`
      );

      const state: SimState = {
        ambulanceId,
        waypoints: routeCoords,
        phase: 'to-user',
        userWaypointCount: pickupWaypointCount,
        waypointsPerTick,
        fractionalIndex: 0,
      };

      state.interval = setInterval(() => {
        const amb = ambulances.find(a => a.id === ambulanceId);
        if (!amb) return;

        state.fractionalIndex += state.waypointsPerTick;
        const maxIdx = state.waypoints.length - 1;

        if (state.fractionalIndex >= maxIdx) {
          state.fractionalIndex = maxIdx;
          const finalPos = state.waypoints[maxIdx];
          amb.location = finalPos;

          io.emit('ambulance:position', {
            ambulanceId,
            location: finalPos,
            phase: state.phase,
            distanceRemaining: 0,
            speed: 0,
          });

          amb.status = 'available';
          if (state.interval) clearInterval(state.interval);
          sims.delete(ambulanceId);
          io.emit('ambulance:arrived', { ambulanceId });

          // After delivery, slowly return to base
          startRetreat(io, ambulanceId);
          return;
        }

        const floorIdx = Math.floor(state.fractionalIndex);
        const t = state.fractionalIndex - floorIdx;
        const pos = lerp(state.waypoints[floorIdx], state.waypoints[Math.min(floorIdx + 1, maxIdx)], t);
        amb.location = pos;

        if (state.phase === 'to-user' && state.fractionalIndex >= state.userWaypointCount) {
          state.phase = 'to-hospital';
          io.emit('ambulance:pickup', { ambulanceId });
        }

        let remaining = 0;
        const startSeg = Math.ceil(state.fractionalIndex);
        remaining += Math.sqrt(
          (state.waypoints[startSeg].lat - pos.lat) ** 2 +
          (state.waypoints[startSeg].lng - pos.lng) ** 2
        ) * 111;
        for (let i = startSeg; i < maxIdx; i++) {
          const a = state.waypoints[i];
          const b = state.waypoints[i + 1];
          remaining += Math.sqrt((b.lat - a.lat) ** 2 + (b.lng - a.lng) ** 2) * 111;
        }

        const progress = state.fractionalIndex / maxIdx;
        const speedVar = 0.85 + Math.sin(progress * Math.PI * 3) * 0.15;

        io.emit('ambulance:position', {
          ambulanceId,
          location: pos,
          phase: state.phase,
          distanceRemaining: Math.round(remaining * 100) / 100,
          speed: Math.round(amb.speed * speedVar),
        });
      }, TICK_MS);

      sims.set(ambulanceId, state);
    });

    socket.on('emergency:reset', () => {
      // Stop all emergency sims
      for (const [id, sim] of sims) {
        if (sim.interval) clearInterval(sim.interval);
        sims.delete(id);
      }

      // Reset statuses
      ambulances.forEach(a => { a.status = 'available'; });

      // Start retreat for any ambulance not at home
      ambulances.forEach(a => {
        startRetreat(io, a.id);
      });

      console.log('🔄 System reset — ambulances retreating to base');
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
}
