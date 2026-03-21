import axios from 'axios';
import { Coordinates, EmergencyResponse, Ambulance, Hospital, EmergencyType } from '../types';

const api = axios.create({ baseURL: '/api', timeout: 10000 });

export const triggerEmergency = async (location: Coordinates, type?: EmergencyType) =>
  (await api.post<EmergencyResponse>('/emergency', { location, type })).data;

export const getAmbulances = async () => (await api.get<Ambulance[]>('/ambulances')).data;

export const getHospitals = async () => (await api.get<Hospital[]>('/hospitals')).data;

export const resetSystem = async () => { await api.post('/reset'); };
