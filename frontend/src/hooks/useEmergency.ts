import { useState, useEffect, useCallback, useRef } from 'react';
import type { EmergencyResponse, AmbulanceUpdate, Ambulance, Hospital, EmergencyType } from '../types';
import { triggerEmergency, getAmbulances, getHospitals, resetSystem } from '../services/api';
import { socket } from '../services/socket';
import type { Coordinates } from '../types';

export interface EmergencyState {
  isActive: boolean;
  isLoading: boolean;
  response: EmergencyResponse | null;
  ambulances: Ambulance[];
  hospitals: Hospital[];
  liveUpdate: AmbulanceUpdate | null;
  userLocation: Coordinates | null;
  phase: 'idle' | 'dispatched' | 'enroute-user' | 'pickup' | 'enroute-hospital' | 'arrived';
  elapsedTime: number;
}

const DEFAULT_LOCATION: Coordinates = { lat: 26.9124, lng: 75.7873 };

export function useEmergency() {
  const [state, setState] = useState<EmergencyState>({
    isActive: false, isLoading: false, response: null,
    ambulances: [], hospitals: [], liveUpdate: null,
    userLocation: null, phase: 'idle', elapsedTime: 0,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [a, h] = await Promise.all([getAmbulances(), getHospitals()]);
        setState(p => ({ ...p, ambulances: a, hospitals: h }));
      } catch (e) { console.error('Load failed:', e); }
    })();
  }, []);

  useEffect(() => {
    const onPos = (u: AmbulanceUpdate) => setState(p => ({
      ...p, liveUpdate: u,
      phase: u.phase === 'to-user' ? 'enroute-user' : 'enroute-hospital',
      ambulances: p.ambulances.map(a => a.id === u.ambulanceId ? { ...a, location: u.location } : a),
    }));
    const onPickup = () => setState(p => ({ ...p, phase: 'pickup' }));
    const onArrived = () => {
      setState(p => ({ ...p, phase: 'arrived', isActive: false }));
      if (timerRef.current) clearInterval(timerRef.current);
    };

    socket.on('ambulance:position', onPos);
    socket.on('ambulance:pickup', onPickup);
    socket.on('ambulance:arrived', onArrived);
    return () => { socket.off('ambulance:position', onPos); socket.off('ambulance:pickup', onPickup); socket.off('ambulance:arrived', onArrived); };
  }, []);

  const trigger = useCallback(async (type?: EmergencyType) => {
    setState(p => ({ ...p, isLoading: true }));
    const loc = DEFAULT_LOCATION;
    try {
      const res = await triggerEmergency(loc, type);
      setState(p => ({ ...p, isActive: true, isLoading: false, response: res, userLocation: loc, phase: 'dispatched', elapsedTime: 0 }));
      timerRef.current = setInterval(() => setState(p => ({ ...p, elapsedTime: p.elapsedTime + 1 })), 1000);
      // Count waypoints in the ambulance→user leg (before user→hospital leg starts)
      const routeCoords = res.optimal.routeCoords ?? [];
      // Find the waypoint closest to user location to split legs
      let pickupWaypointCount = Math.floor(routeCoords.length / 2);
      if (routeCoords.length > 0) {
        let minDist = Infinity;
        routeCoords.forEach((c, i) => {
          const d = Math.abs(c.lat - loc.lat) + Math.abs(c.lng - loc.lng);
          if (d < minDist) { minDist = d; pickupWaypointCount = i; }
        });
      }

      socket.emit('emergency:simulate', {
        ambulanceId: res.optimal.ambulance.id,
        userLocation: loc,
        hospitalLocation: res.optimal.hospital.location,
        routeCoords,
        pickupWaypointCount,
        totalDurationMin: res.optimal.totalTime,
      });
    } catch (e) {
      console.error('Emergency failed:', e);
      setState(p => ({ ...p, isLoading: false }));
    }
  }, []);

  const reset = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await resetSystem();
    const [a, h] = await Promise.all([getAmbulances(), getHospitals()]);
    setState({ isActive: false, isLoading: false, response: null, ambulances: a, hospitals: h, liveUpdate: null, userLocation: null, phase: 'idle', elapsedTime: 0 });
  }, []);

  return { ...state, trigger, reset };
}
