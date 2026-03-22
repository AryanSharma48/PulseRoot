import { Coordinates, RouteOption, EmergencyResponse } from '../types/index.js';
import { ambulances } from '../data/ambulances.js';
import { hospitals } from '../data/hospitals.js';
import {
  haversineDistance,
  fetchRoadRoute,
  fetchTrafficRoute,
} from './routeService.js';

// ─── Tuning constants ────────────────────────────────────────────────────────

/** Maximum straight-line radius to pre-filter candidates (km) */
const RADIUS_KM = 40;

/**
 * How many candidates survive Phase 1 (haversine pre-filter) per hospital.
 * We keep the top N ambulances by straight-line distance before paying for
 * traffic API calls. 5 gives good coverage without burning quota.
 */
const TOP_N_PREFILTER = 5;

/**
 * A* cost weights.
 *   pickupTime  — getting to the patient is the PRIMARY objective
 *   hospitalTime — total journey also matters but is secondary
 *   specialtyBonus — matching hospital capability is a tie-breaker
 */
const W_PICKUP   = 0.70;
const W_HOSPITAL = 0.20;
const W_SPECIALTY = 0.10; // applied as a time-equivalent discount

function generateId(): string {
  return `EMR-${Date.now().toString(36).toUpperCase()}`;
}

// ─── Main entry point ────────────────────────────────────────────────────────

export async function processEmergency(
  userLocation: Coordinates,
  emergencyType?: string,
): Promise<EmergencyResponse> {

  const available = ambulances.filter(a => a.status === 'available');
  const eligible  = hospitals.filter(h => h.hasEmergency && h.availableBeds > 0);

  // ── Phase 1: Haversine pre-filter ─────────────────────────────────────────
  // Keep only ambulances within RADIUS_KM to avoid distant API calls.
  // Among those, sort by straight-line distance to patient and keep TOP_N.
  // This is our "admissible heuristic" — it cannot overestimate real road time.

  const inRadius = available
    .filter(a => haversineDistance(a.location, userLocation) <= RADIUS_KM)
    .sort((a, b) =>
      haversineDistance(a.location, userLocation) -
      haversineDistance(b.location, userLocation)
    )
    .slice(0, TOP_N_PREFILTER);

  if (inRadius.length === 0) {
    return {
      id: generateId(),
      userLocation,
      optimal: null as any,
      alternatives: [],
      timestamp: Date.now(),
      error: 'No ambulances available within 40 km of your location.',
    };
  }

  console.log(
    `\n🔍 A* routing — evaluating ${inRadius.length} ambulance(s) × ${eligible.length} hospital(s)`,
  );

  // ── Phase 2: Traffic-aware A* cost for every (ambulance, hospital) pair ───
  // fetchTrafficRoute uses Mapbox `driving-traffic` profile — durations
  // returned are already weighted by live road-graph congestion.
  // Structurally this is equivalent to running A* where g(n) = cumulative
  // traffic-weighted travel time and h(n) = 0 (since Mapbox gives us the
  // full optimal path cost in one call).

  type Candidate = {
    ambulance: typeof inRadius[0];
    hospital:  typeof eligible[0];
    sourceHospital: typeof eligible[0];
    pickupMin:  number;
    hospitalMin: number;
    totalMin:   number;
    distKm:     number;
    score:      number;
    routeCoords: Coordinates[];
  };

  const candidatePromises: Promise<Candidate>[] = [];

  for (const ambulance of inRadius) {
    const sourceHospital =
      hospitals.find(h => h.id === ambulance.homeHospitalId) || eligible[0];

    for (const hospital of eligible) {
      candidatePromises.push(
        (async (): Promise<Candidate> => {
          // Leg 1: ambulance → patient (traffic-weighted — determines dispatch winner)
          // Leg 2: patient → hospital (traffic-weighted — determines delivery time)
          const [leg1, leg2] = await Promise.all([
            fetchTrafficRoute(ambulance.location, userLocation),
            fetchTrafficRoute(userLocation, hospital.location),
          ]);

          const pickupMin  = leg1.durationMin;
          const hospitalMin = leg2.durationMin;
          const totalMin   = pickupMin + hospitalMin;
          const distKm     = leg1.distanceKm + leg2.distanceKm;

          // ── Phase 3: Weighted A* score ──────────────────────────────────
          // Lower score = faster overall response.
          // Pickup dominates (0.70) because the primary goal is reaching the
          // patient first. Hospital leg is secondary (0.20). Specialty match
          // is a small bonus modeled as a time discount (saves ~15% pickup eq.).

          let score = W_PICKUP * pickupMin + W_HOSPITAL * hospitalMin;

          // Specialty bonus — reduces effective score like a time credit
          if (emergencyType && hospital.specialties.includes(emergencyType)) {
            score *= (1 - W_SPECIALTY * 0.85);
          }
          // Bed availability bonus (small — more beds = slight preference)
          score *= 1 - (hospital.availableBeds / 40) * 0.05;

          console.log(
            `  ${ambulance.name} → ${hospital.name}: ` +
            `pickup=${pickupMin.toFixed(1)}m ` +
            `hosp=${hospitalMin.toFixed(1)}m ` +
            `score=${score.toFixed(2)}`,
          );

          return {
            ambulance,
            hospital,
            sourceHospital,
            pickupMin,
            hospitalMin,
            totalMin,
            distKm,
            score,
            routeCoords: [...leg1.coords, ...leg2.coords],
          };
        })(),
      );
    }
  }

  const candidates: Candidate[] = await Promise.all(candidatePromises);

  // Sort ascending by A* score — lowest = fastest traffic-aware response
  candidates.sort((a, b) => a.score - b.score);

  console.log(
    `\n✅ Winner: ${candidates[0].ambulance.name} ` +
    `(pickup ${candidates[0].pickupMin.toFixed(1)} min via traffic)\n`,
  );

  // ── Build final RouteOption objects ──────────────────────────────────────
  // For display coords we use the traffic route (already fetched above).
  // Top result = optimal, up to 2 more = alternatives shown on the map.

  const options: RouteOption[] = candidates.slice(0, 3).map((c, i) => ({
    ambulance:      { ...c.ambulance },
    hospital:       { ...c.hospital },
    sourceHospital: { ...c.sourceHospital },
    pickupETA:      Math.round(c.pickupMin  * 10) / 10,
    hospitalETA:    Math.round(c.hospitalMin * 10) / 10,
    totalTime:      Math.round(c.totalMin   * 10) / 10,
    distance:       Math.round(c.distKm     * 100) / 100,
    score:          c.score,
    isOptimal:      i === 0,
    routeCoords:    c.routeCoords,
  }));

  return {
    id: generateId(),
    userLocation,
    optimal:      options[0],
    alternatives: options.slice(1),
    timestamp:    Date.now(),
  };
}
