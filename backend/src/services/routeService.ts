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
