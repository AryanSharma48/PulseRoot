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

export function interpolateRoute(from: Coordinates, to: Coordinates, steps = 20): Coordinates[] {
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
 * Fetch a real road-based route from Mapbox Directions API.
 * Returns route coordinates, distance (km), and duration (minutes).
 */
export async function fetchRoadRoute(
  from: Coordinates,
  to: Coordinates,
): Promise<{ coords: Coordinates[]; distanceKm: number; durationMin: number }> {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    console.warn('⚠️ MAPBOX_TOKEN not set, falling back to straight line');
    const dist = haversineDistance(from, to);
    return { coords: interpolateRoute(from, to, 20), distanceKm: dist, durationMin: dist / 40 * 60 };
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&overview=full&access_token=${token}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
      console.warn('⚠️ No routes found, falling back to straight line');
      const dist = haversineDistance(from, to);
      return { coords: interpolateRoute(from, to, 20), distanceKm: dist, durationMin: dist / 40 * 60 };
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
    console.error('Mapbox Directions API error:', err);
    const dist = haversineDistance(from, to);
    return { coords: interpolateRoute(from, to, 20), distanceKm: dist, durationMin: dist / 40 * 60 };
  }
}
