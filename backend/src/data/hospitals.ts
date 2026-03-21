import { Hospital } from '../types/index.js';

export const hospitals: Hospital[] = [
  {
    id: 'HSP-001',
    name: 'SMS Hospital',
    location: { lat: 26.9120, lng: 75.7900 },
    availableBeds: 12,
    hasEmergency: true,
    specialties: ['trauma', 'cardiac', 'general'],
  },
  {
    id: 'HSP-002',
    name: 'Fortis Escorts',
    location: { lat: 26.9000, lng: 75.7650 },
    availableBeds: 5,
    hasEmergency: true,
    specialties: ['cardiac', 'respiratory'],
  },
  {
    id: 'HSP-003',
    name: 'Mahatma Gandhi Hospital',
    location: { lat: 26.9300, lng: 75.7850 },
    availableBeds: 8,
    hasEmergency: true,
    specialties: ['trauma', 'general'],
  },
  {
    id: 'HSP-004',
    name: 'Narayana Multispecialty',
    location: { lat: 26.8950, lng: 75.8100 },
    availableBeds: 3,
    hasEmergency: true,
    specialties: ['trauma', 'cardiac', 'respiratory', 'general'],
  },
];
