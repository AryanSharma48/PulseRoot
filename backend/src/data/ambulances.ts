import { Ambulance, Coordinates } from '../types/index.js';

export const ambulanceHomeBases: Map<string, Coordinates> = new Map();

export const ambulances: Ambulance[] = [
  {
    id: 'AMB-001', name: 'Unit Alpha',
    location: { lat: 26.9225, lng: 75.7980 },
    status: 'available', speed: 45,
    homeHospitalId: 'HSP-001',
  },
  {
    id: 'AMB-002', name: 'Unit Bravo',
    location: { lat: 26.9050, lng: 75.7700 },
    status: 'available', speed: 40,
    homeHospitalId: 'HSP-002',
  },
  {
    id: 'AMB-003', name: 'Unit Charlie',
    location: { lat: 26.9350, lng: 75.7750 },
    status: 'available', speed: 50,
    homeHospitalId: 'HSP-003',
  },
  {
    id: 'AMB-004', name: 'Unit Delta',
    location: { lat: 26.8950, lng: 75.8050 },
    status: 'available', speed: 42,
    homeHospitalId: 'HSP-004',
  },
  {
    id: 'AMB-005', name: 'Unit Echo',
    location: { lat: 26.9150, lng: 75.8150 },
    status: 'available', speed: 48,
    homeHospitalId: 'HSP-005',
  },
  {
    id: 'AMB-006', name: 'Unit Foxtrot',
    location: { lat: 26.8800, lng: 75.7500 },
    status: 'available', speed: 44,
    homeHospitalId: 'HSP-006',
  },
  {
    id: 'AMB-007', name: 'Unit Golf',
    location: { lat: 26.8650, lng: 75.7950 },
    status: 'available', speed: 46,
    homeHospitalId: 'HSP-007',
  },
  {
    id: 'AMB-008', name: 'Unit Hotel',
    location: { lat: 26.9200, lng: 75.7600 },
    status: 'available', speed: 43,
    homeHospitalId: 'HSP-008',
  },
];

ambulances.forEach(a => {
  ambulanceHomeBases.set(a.id, { lat: a.location.lat, lng: a.location.lng });
});
