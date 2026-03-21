import { RouteOption } from '../types';

interface Props { route: RouteOption; }

export default function RouteDisplay({ route }: Props) {
  return (
    <div className="glass-panel-light p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">{route.ambulance.name} → {route.hospital.name}</span>
        {route.isOptimal && <span className="status-pill bg-green-500/20 text-green-400">Best</span>}
      </div>
      <div className="flex gap-4 text-sm">
        <div><span className="text-gray-500">ETA: </span><span className="text-white font-mono">{route.totalTime}m</span></div>
        <div><span className="text-gray-500">Dist: </span><span className="text-white font-mono">{route.distance}km</span></div>
      </div>
    </div>
  );
}
