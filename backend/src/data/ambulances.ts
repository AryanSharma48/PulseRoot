import { Ambulance } from '../types/index.js';

export const ambulances: Ambulance[] = [
  {
    id: 'AMB-001',
    name: 'Unit Alpha',
    location: { lat: 26.9225, lng: 75.7980 },
    status: 'available',
    speed: 45,
  },
  {
    id: 'AMB-002',
    name: 'Unit Bravo',
    location: { lat: 26.9050, lng: 75.7700 },
    status: 'available',
    speed: 40,
  },
  {
    id: 'AMB-003',
    name: 'Unit Charlie',
    location: { lat: 26.9350, lng: 75.7750 },
    status: 'available',
    speed: 50,
  },
  {
    id: 'AMB-004',
    name: 'Unit Delta',
    location: { lat: 26.8950, lng: 75.8050 },
    status: 'busy',
    speed: 42,
  },
  {
    id: 'AMB-005',
    name: 'Unit Echo',
    location: { lat: 26.9150, lng: 75.8150 },
    status: 'available',
    speed: 48,
  },
];
