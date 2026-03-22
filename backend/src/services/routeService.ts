import https from 'https';
import { Coordinates } from '../types/index.js';

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function estimateETA(distanceKm: number, speedKmh: number): number {
  return Math.round((distanceKm / speedKmh) * 60 * 10) / 10;
}

export function interpolateRoute(from: Coordinates, to: Coordinates, steps = 40): Coordinates[] {
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

function fallbackRoute(from: Coordinates, to: Coordinates) {
  const dist = haversineDistance(from, to);
  return { coords: interpolateRoute(from, to, 40), distanceKm: dist, durationMin: (dist / 40) * 60 };
}

/** Make HTTPS GET request using Node's built-in https module (more reliable than fetch) */
function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Fetch a real road-based route from Mapbox Directions API.
 * Uses the plain `driving` profile — no traffic adjustment.
 * Used for simulation/animation coordinates.
 */
export async function fetchRoadRoute(
  from: Coordinates,
  to: Coordinates,
): Promise<{ coords: Coordinates[]; distanceKm: number; durationMin: number }> {
  return _fetchMapboxRoute('driving', from, to);
}

/**
 * Fetch a traffic-aware route using Mapbox `driving-traffic` profile.
 * Duration is adjusted for LIVE traffic conditions — this is the A* edge cost.
 * Used by the decision engine to find the fastest ambulance to dispatch.
 */
export async function fetchTrafficRoute(
  from: Coordinates,
  to: Coordinates,
): Promise<{ coords: Coordinates[]; distanceKm: number; durationMin: number }> {
  return _fetchMapboxRoute('driving-traffic', from, to);
}

/** Internal: fetch route with given Mapbox profile */
async function _fetchMapboxRoute(
  profile: 'driving' | 'driving-traffic',
  from: Coordinates,
  to: Coordinates,
): Promise<{ coords: Coordinates[]; distanceKm: number; durationMin: number }> {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    console.warn('⚠️ MAPBOX_TOKEN not set, falling back to straight line');
    return fallbackRoute(from, to);
  }

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?geometries=geojson&overview=full&access_token=${token}`;

  try {
    const body = await httpsGet(url);
    const data = JSON.parse(body);

    if (!data.routes || data.routes.length === 0) {
      console.warn(`⚠️ No routes found (${profile}), falling back to straight line`);
      return fallbackRoute(from, to);
    }

    const route = data.routes[0];
    const coords: Coordinates[] = route.geometry.coordinates.map(
      (c: [number, number]) => ({ lat: c[1], lng: c[0] })
    );

    return {
      coords,
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
    };
  } catch (err) {
    console.error(`Mapbox API error (${profile}):`, err);
    return fallbackRoute(from, to);
  }
}
