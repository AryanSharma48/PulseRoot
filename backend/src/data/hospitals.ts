import { Hospital } from '../types/index.js';

export const hospitals: Hospital[] = [
  {
    id: 'HSP-001', name: 'SMS Hospital',
    location: { lat: 26.9120, lng: 75.7900 },
    availableBeds: 12, hasEmergency: true,
    specialties: ['trauma', 'cardiac', 'general'],
  },
  {
    id: 'HSP-002', name: 'Fortis Escorts',
    location: { lat: 26.9000, lng: 75.7650 },
    availableBeds: 5, hasEmergency: true,
    specialties: ['cardiac', 'respiratory'],
  },
  {
    id: 'HSP-003', name: 'Mahatma Gandhi Hospital',
    location: { lat: 26.9300, lng: 75.7850 },
    availableBeds: 8, hasEmergency: true,
    specialties: ['trauma', 'general'],
  },
  {
    id: 'HSP-004', name: 'Narayana Multispecialty',
    location: { lat: 26.8950, lng: 75.8100 },
    availableBeds: 3, hasEmergency: true,
    specialties: ['trauma', 'cardiac', 'respiratory', 'general'],
  },
  {
    id: 'HSP-005', name: 'Manipal Hospital',
    location: { lat: 26.8800, lng: 75.7500 },
    availableBeds: 10, hasEmergency: true,
    specialties: ['cardiac', 'respiratory', 'general'],
  },
  {
    id: 'HSP-006', name: 'Eternal Hospital',
    location: { lat: 26.9400, lng: 75.8200 },
    availableBeds: 6, hasEmergency: true,
    specialties: ['trauma', 'cardiac'],
  },
  {
    id: 'HSP-007', name: 'RUHS Hospital',
    location: { lat: 26.8650, lng: 75.7950 },
    availableBeds: 15, hasEmergency: true,
    specialties: ['trauma', 'general', 'respiratory'],
  },
  {
    id: 'HSP-008', name: 'Apex Hospital',
    location: { lat: 26.9200, lng: 75.7600 },
    availableBeds: 7, hasEmergency: true,
    specialties: ['cardiac', 'trauma', 'general'],
  },
];
