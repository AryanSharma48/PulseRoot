import { Coordinates, RouteOption, EmergencyResponse } from '../types/index.js';
import { ambulances } from '../data/ambulances.js';
import { hospitals } from '../data/hospitals.js';
import { haversineDistance, estimateETA, fetchRoadRoute } from './routeService.js';

function generateId(): string {
  return `EMR-${Date.now().toString(36).toUpperCase()}`;
}

export async function processEmergency(
  userLocation: Coordinates,
  emergencyType?: string,
): Promise<EmergencyResponse> {
  const available = ambulances.filter(a => a.status === 'available');
  const eligible = hospitals.filter(h => h.hasEmergency && h.availableBeds > 0);

  // Phase 1: Quick haversine scoring to find top candidates
  const candidates: {
    ambulance: typeof available[0];
    hospital: typeof eligible[0];
    roughTime: number;
    score: number;
  }[] = [];

  for (const ambulance of available) {
    for (const hospital of eligible) {
      const ambToUser = haversineDistance(ambulance.location, userLocation);
      const userToHosp = haversineDistance(userLocation, hospital.location);
      const roughTime = estimateETA(ambToUser + userToHosp, ambulance.speed);

      let score = roughTime;
      if (emergencyType && hospital.specialties.includes(emergencyType)) {
        score *= 0.85;
      }
      score *= 1 - (hospital.availableBeds / 20) * 0.1;

      candidates.push({ ambulance, hospital, roughTime, score });
    }
  }

  candidates.sort((a, b) => a.score - b.score);
  const topCandidates = candidates.slice(0, 3);

  // Phase 2: Fetch real road routes for top 3 only
  const options: RouteOption[] = await Promise.all(
    topCandidates.map(async (c) => {
      const [leg1, leg2] = await Promise.all([
        fetchRoadRoute(c.ambulance.location, userLocation),
        fetchRoadRoute(userLocation, c.hospital.location),
      ]);

      const totalTime = Math.round((leg1.durationMin + leg2.durationMin) * 10) / 10;
      const totalDist = Math.round((leg1.distanceKm + leg2.distanceKm) * 100) / 100;

      return {
        ambulance: { ...c.ambulance },
        hospital: { ...c.hospital },
        pickupETA: Math.round(leg1.durationMin * 10) / 10,
        hospitalETA: Math.round(leg2.durationMin * 10) / 10,
        totalTime,
        distance: totalDist,
        score: c.score,
        isOptimal: false,
        routeCoords: [...leg1.coords, ...leg2.coords],
      };
    }),
  );

  options.sort((a, b) => a.score - b.score);
  if (options.length > 0) options[0].isOptimal = true;

  return {
    id: generateId(),
    userLocation,
    optimal: options[0],
    alternatives: options.slice(1),
    timestamp: Date.now(),
  };
}
