export interface Coordinates { lat: number; lng: number; }

export interface Ambulance {
  id: string;
  name: string;
  location: Coordinates;
  status: 'available' | 'dispatched' | 'enroute' | 'busy';
  speed: number;
  homeHospitalId: string;
}

export interface Hospital {
  id: string;
  name: string;
  location: Coordinates;
  availableBeds: number;
  hasEmergency: boolean;
  specialties: string[];
}

export interface RouteOption {
  ambulance: Ambulance;
  hospital: Hospital;
  sourceHospital: Hospital;
  pickupETA: number;
  hospitalETA: number;
  totalTime: number;
  distance: number;
  score: number;
  isOptimal: boolean;
  routeCoords?: Coordinates[];
}

export interface EmergencyResponse {
  id: string;
  userLocation: Coordinates;
  optimal: RouteOption;
  alternatives: RouteOption[];
  timestamp: number;
  error?: string;
}

export interface AmbulanceUpdate {
  ambulanceId: string;
  location: Coordinates;
  phase: 'to-user' | 'to-hospital';
  distanceRemaining: number;
  speed: number;
}

export type EmergencyType = 'cardiac' | 'trauma' | 'general' | 'respiratory';
