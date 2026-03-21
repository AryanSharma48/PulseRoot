import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Ambulance, Hospital, Coordinates, RouteOption } from '../types';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface Props {
  ambulances: Ambulance[];
  hospitals: Hospital[];
  userLocation: Coordinates | null;
  optimalRoute: RouteOption | null;
  alternatives: RouteOption[];
  isActive: boolean;
}

export default function MapView({ ambulances, hospitals, userLocation, optimalRoute, alternatives, isActive }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const userMarker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [75.7873, 26.9124],
      zoom: 13, pitch: 45, bearing: -17.6,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('optimal-route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } });
      map.addLayer({ id: 'optimal-route-line', type: 'line', source: 'optimal-route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.9 } });
      map.addSource('alt-route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } });
      map.addLayer({ id: 'alt-route-line', type: 'line', source: 'alt-route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#6b7280', 'line-width': 3, 'line-opacity': 0.4 } });
    });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    ambulances.forEach(amb => {
      const existing = markers.current.get(amb.id);
      if (existing) {
        existing.setLngLat([amb.location.lng, amb.location.lat]);
        existing.getElement().className = `ambulance-marker ${amb.status === 'dispatched' ? 'dispatched' : ''}`;
      } else {
        const el = document.createElement('div');
        el.className = `ambulance-marker ${amb.status === 'dispatched' ? 'dispatched' : ''}`;
        el.innerHTML = '🚑';
        el.title = `${amb.name} (${amb.id})`;
        markers.current.set(amb.id, new mapboxgl.Marker({ element: el }).setLngLat([amb.location.lng, amb.location.lat]).addTo(map));
      }
    });
  }, [ambulances]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    hospitals.forEach(h => {
      const key = `h-${h.id}`;
      if (!markers.current.has(key)) {
        const el = document.createElement('div');
        el.className = 'hospital-marker';
        el.innerHTML = '🏥';
        el.title = h.name;
        markers.current.set(key, new mapboxgl.Marker({ element: el }).setLngLat([h.location.lng, h.location.lat]).addTo(map));
      }
    });
  }, [hospitals]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;
    if (userMarker.current) {
      userMarker.current.setLngLat([userLocation.lng, userLocation.lat]);
    } else {
      const el = document.createElement('div');
      el.className = 'emergency-pulse';
      userMarker.current = new mapboxgl.Marker({ element: el }).setLngLat([userLocation.lng, userLocation.lat]).addTo(map);
      map.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 14, duration: 1500 });
    }
  }, [userLocation, isActive]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource('optimal-route') as mapboxgl.GeoJSONSource | undefined;
    if (!src) return;
    if (optimalRoute?.routeCoords?.length) {
      src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: optimalRoute.routeCoords.map(c => [c.lng, c.lat]) }, properties: {} });
    } else {
      src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} });
    }
    const altSrc = map.getSource('alt-route') as mapboxgl.GeoJSONSource | undefined;
    if (altSrc && alternatives[0]?.routeCoords?.length) {
      altSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: alternatives[0].routeCoords.map(c => [c.lng, c.lat]) }, properties: {} });
    }
  }, [optimalRoute, alternatives]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}
