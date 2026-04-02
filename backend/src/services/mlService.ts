import { Coordinates } from '../types/index.js';
import { haversineDistance } from './routeService.js';

interface PredictETAInput {
  distance: number;
  time_of_day: number;
  traffic_level: number;
  area_type: 'urban' | 'rural';
}

interface PredictETAOutput {
  eta: number;
}

class MLService {
  private baseUrl: string;
  private cache: Map<string, number>;

  constructor() {
    this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    this.cache = new Map();
  }

  /**
   * Generates a cache key based on prediction inputs.
   */
  private getCacheKey(input: PredictETAInput): string {
    return `${input.distance.toFixed(2)}-${input.time_of_day}-${input.traffic_level}-${input.area_type}`;
  }

  /**
   * Predicts ETA using the ML microservice.
   * Acts as a **Learned Cost Oracle** for the A* engine.
   */
  async predictETA(
    from: Coordinates,
    to: Coordinates,
    trafficLevel = 1.0,
    areaType: 'urban' | 'rural' = 'urban'
  ): Promise<number> {
    const distance = haversineDistance(from, to);
    const timeOfDay = new Date().getHours();

    const input: PredictETAInput = {
      distance,
      time_of_day: timeOfDay,
      traffic_level: trafficLevel,
      area_type: areaType,
    };

    const cacheKey = this.getCacheKey(input);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const response = await fetch(`${this.baseUrl}/predict-eta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`ML Service responded with ${response.status}`);
      }

      const data = (await response.json()) as PredictETAOutput;
      this.cache.set(cacheKey, data.eta);
      return data.eta;

    } catch (error) {
      console.error('⚠️ ML Service unreachable, falling back to heuristic:', error);
      
      // 🛡️ Fallback: Heuristic based on distance and average speed (40 km/h)
      const fallbackETA = (distance / 40) * 60;
      return Math.round(fallbackETA * 100) / 100;
    }
  }
}

export const mlService = new MLService();
