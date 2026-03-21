import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Ambulance, Hospital, Coordinates, RouteOption } from '../types';
import { socket } from '../services/socket';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface Props {
  ambulances: Ambulance[];
  hospitals: Hospital[];
  userLocation: Coordinates | null;
  pinnedLocation: Coordinates | null;
  optimalRoute: RouteOption | null;
  alternatives: RouteOption[];
  isActive: boolean;
  onMapClick: (coords: Coordinates) => void;
}

export default function MapView({
  ambulances, hospitals, userLocation, pinnedLocation,
  optimalRoute, alternatives, isActive, onMapClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const pinMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [75.7873, 26.9124],
      zoom: 13, pitch: 45, bearing: -17.6,
    });
    mapRef.current = map;

    map.on('click', (e) => {
      onMapClickRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    map.on('load', () => {
      map.addSource('optimal-route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
      });
      map.addLayer({
        id: 'optimal-route-line', type: 'line', source: 'optimal-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.9 },
      });
      map.addSource('alt-route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
      });
      map.addLayer({
        id: 'alt-route-line', type: 'line', source: 'alt-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#6b7280', 'line-width': 3, 'line-opacity': 0.4 },
      });
    });

    // Listen to ambulance position updates DIRECTLY (bypass React state)
    // This ensures markers update at 10Hz without React re-render overhead
    socket.on('ambulance:position', (data: { ambulanceId: string; location: Coordinates }) => {
      const marker = markersRef.current.get(data.ambulanceId);
      if (marker) {
        marker.setLngLat([data.location.lng, data.location.lat]);
      }
    });

    // Retreat events — same map movement, separate from dashboard tracking
    socket.on('ambulance:retreat', (data: { ambulanceId: string; location: Coordinates }) => {
      const marker = markersRef.current.get(data.ambulanceId);
      if (marker) {
        marker.setLngLat([data.location.lng, data.location.lat]);
      }
    });

    return () => {
      socket.off('ambulance:position');
      socket.off('ambulance:retreat');
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Create ambulance markers (only when initial data loads or full reset)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    ambulances.forEach(amb => {
      const existing = markersRef.current.get(amb.id);
      if (existing) {
        // Marker exists — socket listeners handle position. Do nothing.
      } else {
        const el = document.createElement('div');
        el.className = 'ambulance-marker';
        el.innerHTML = '🚑';
        el.title = `${amb.name} (${amb.id})`;
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([amb.location.lng, amb.location.lat])
          .addTo(map);
        markersRef.current.set(amb.id, marker);
      }
    });
  }, [ambulances]);

  // Hospital markers (created once)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    hospitals.forEach(h => {
      const key = `h-${h.id}`;
      if (!markersRef.current.has(key)) {
        const el = document.createElement('div');
        el.className = 'hospital-marker';
        el.innerHTML = '🏥';
        el.title = h.name;
        markersRef.current.set(key, new mapboxgl.Marker({ element: el })
          .setLngLat([h.location.lng, h.location.lat]).addTo(map));
      }
    });
  }, [hospitals]);

  // Pin marker (before emergency)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (pinnedLocation && !isActive) {
      if (pinMarkerRef.current) {
        pinMarkerRef.current.setLngLat([pinnedLocation.lng, pinnedLocation.lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'pin-marker';
        el.innerHTML = '📍';
        pinMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat([pinnedLocation.lng, pinnedLocation.lat]).addTo(map);
      }
      map.flyTo({ center: [pinnedLocation.lng, pinnedLocation.lat], duration: 800 });
    } else if (!pinnedLocation && pinMarkerRef.current) {
      pinMarkerRef.current.remove();
      pinMarkerRef.current = null;
    }
  }, [pinnedLocation, isActive]);

  // Emergency user marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove marker if reset (no userLocation) or emergency is over (arrived/cancelled)
    if (!userLocation || !isActive) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    if (isActive && pinMarkerRef.current) {
      pinMarkerRef.current.remove();
      pinMarkerRef.current = null;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    } else {
      const el = document.createElement('div');
      el.className = 'emergency-pulse';
      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat]).addTo(map);
      map.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 14, duration: 1500 });
    }
  }, [userLocation, isActive]);

  // Route lines
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource('optimal-route') as mapboxgl.GeoJSONSource | undefined;
    if (!src) return;
    
    if (isActive && optimalRoute?.routeCoords?.length) {
      src.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: optimalRoute.routeCoords.map(c => [c.lng, c.lat]) },
        properties: {},
      });
    } else {
      src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} });
    }
    
    const altSrc = map.getSource('alt-route') as mapboxgl.GeoJSONSource | undefined;
    if (isActive && altSrc && alternatives[0]?.routeCoords?.length) {
      altSrc.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: alternatives[0].routeCoords.map(c => [c.lng, c.lat]) },
        properties: {},
      });
    } else if (altSrc) {
      altSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} });
    }
  }, [optimalRoute, alternatives, isActive]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}
