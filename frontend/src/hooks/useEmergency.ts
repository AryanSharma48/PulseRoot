import { useState, useEffect, useCallback, useRef } from 'react';
import type { EmergencyResponse, AmbulanceUpdate, Ambulance, Hospital, EmergencyType, Coordinates } from '../types';
import { triggerEmergency, getAmbulances, getHospitals, resetSystem } from '../services/api';
import { socket } from '../services/socket';

export interface EmergencyState {
  isActive: boolean;
  isLoading: boolean;
  response: EmergencyResponse | null;
  ambulances: Ambulance[];
  hospitals: Hospital[];
  liveUpdate: AmbulanceUpdate | null;
  userLocation: Coordinates | null;
  pinnedLocation: Coordinates | null;
  phase: 'idle' | 'dispatched' | 'enroute-user' | 'pickup' | 'enroute-hospital' | 'arrived';
  elapsedTime: number;
  locationMode: 'none' | 'gps' | 'pin';
  errorMessage: string | null;
  bookingTime: Date | null;
}

export function useEmergency() {
  const [state, setState] = useState<EmergencyState>({
    isActive: false, isLoading: false, response: null,
    ambulances: [], hospitals: [], liveUpdate: null,
    userLocation: null, pinnedLocation: null,
    phase: 'idle', elapsedTime: 0, locationMode: 'none',
    errorMessage: null, bookingTime: null,
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
    const onPos = (u: AmbulanceUpdate) => setState(p => {
      // Only update dashboard tracking for the active emergency's ambulance
      const activeAmbId = p.response?.optimal?.ambulance?.id;
      if (activeAmbId && u.ambulanceId !== activeAmbId) return p;
      return {
        ...p, liveUpdate: u,
        phase: u.phase === 'to-user' ? 'enroute-user' : 'enroute-hospital',
      };
    });
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

  // Drop pin on map
  const setPin = useCallback((coords: Coordinates) => {
    if (state.isActive) return;
    setState(p => ({ ...p, pinnedLocation: coords, locationMode: 'pin' }));
  }, [state.isActive]);

  // Use browser geolocation
  const useMyLocation = useCallback(() => {
    if (state.isActive) return;
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setState(p => ({ ...p, pinnedLocation: coords, locationMode: 'gps' }));
      },
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [state.isActive]);

  // Clear pin
  const clearPin = useCallback(() => {
    if (state.isActive) return;
    setState(p => ({ ...p, pinnedLocation: null, locationMode: 'none' }));
  }, [state.isActive]);

  const trigger = useCallback(async (type?: EmergencyType) => {
    const loc = state.pinnedLocation;
    if (!loc) {
      console.error('No location set — drop a pin or use GPS');
      return;
    }
    setState(p => ({ ...p, isLoading: true }));
    try {
      const res = await triggerEmergency(loc, type);
      if (res.error) {
        setState(p => ({ ...p, isLoading: false, errorMessage: res.error! }));
        return;
      }
      setState(p => ({ ...p, isActive: true, isLoading: false, response: res, userLocation: loc, phase: 'dispatched', elapsedTime: 0, bookingTime: new Date() }));
      timerRef.current = setInterval(() => setState(p => ({ ...p, elapsedTime: p.elapsedTime + 1 })), 1000);

      const routeCoords = res.optimal.routeCoords ?? [];
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
  }, [state.pinnedLocation]);

  const reset = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    socket.emit('emergency:reset');
    await resetSystem();
    const [a, h] = await Promise.all([getAmbulances(), getHospitals()]);
    setState({ isActive: false, isLoading: false, response: null, ambulances: a, hospitals: h, liveUpdate: null, userLocation: null, pinnedLocation: null, phase: 'idle', elapsedTime: 0, locationMode: 'none', errorMessage: null, bookingTime: null });
  }, []);

  const clearError = useCallback(() => setState(p => ({ ...p, errorMessage: null })), []);

  return { ...state, trigger, reset, setPin, useMyLocation, clearPin, clearError };
}
