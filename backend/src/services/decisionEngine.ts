import { Coordinates, RouteOption, EmergencyResponse } from '../types/index.js';
import { ambulances } from '../data/ambulances.js';
import { hospitals } from '../data/hospitals.js';
import { haversineDistance, estimateETA, interpolateRoute } from './routeService.js';

function generateId(): string {
  return `EMR-${Date.now().toString(36).toUpperCase()}`;
}

export function processEmergency(userLocation: Coordinates, emergencyType?: string): EmergencyResponse {
  const available = ambulances.filter(a => a.status === 'available');
  const eligible = hospitals.filter(h => h.hasEmergency && h.availableBeds > 0);

  const options: RouteOption[] = [];

  for (const ambulance of available) {
    for (const hospital of eligible) {
      const ambToUser = haversineDistance(ambulance.location, userLocation);
      const userToHosp = haversineDistance(userLocation, hospital.location);
      const pickupETA = estimateETA(ambToUser, ambulance.speed);
      const hospitalETA = estimateETA(userToHosp, ambulance.speed);
      const totalTime = pickupETA + hospitalETA;

      let score = totalTime;
      if (emergencyType && hospital.specialties.includes(emergencyType)) {
        score *= 0.85;
      }
      score *= 1 - (hospital.availableBeds / 20) * 0.1;

      options.push({
        ambulance: { ...ambulance },
        hospital: { ...hospital },
        pickupETA,
        hospitalETA,
        totalTime,
        distance: Math.round((ambToUser + userToHosp) * 100) / 100,
        score,
        isOptimal: false,
        routeCoords: [
          ...interpolateRoute(ambulance.location, userLocation, 15),
          ...interpolateRoute(userLocation, hospital.location, 15),
        ],
      });
    }
  }

  options.sort((a, b) => a.score - b.score);
  if (options.length > 0) options[0].isOptimal = true;

  return {
    id: generateId(),
    userLocation,
    optimal: options[0],
    alternatives: options.slice(1, 3),
    timestamp: Date.now(),
  };
}
