import type { Ambulance } from '../types';

interface Props { ambulance: Ambulance; isDispatched: boolean; }

export default function AmbulanceMarker({ ambulance, isDispatched }: Props) {
  return (
    <div className="flex items-center gap-3 glass-panel-light p-3">
      <span className="text-2xl">🚑</span>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{ambulance.name}</p>
        <p className="text-xs text-gray-400">{ambulance.id}</p>
      </div>
      <span className={`status-pill ${isDispatched ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
        {isDispatched ? 'Dispatched' : ambulance.status}
      </span>
    </div>
  );
}
