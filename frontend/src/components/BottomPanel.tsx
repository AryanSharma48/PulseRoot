import { AmbulanceUpdate, RouteOption } from '../types';

interface Props {
  liveUpdate: AmbulanceUpdate | null;
  optimal: RouteOption | null;
  phase: string;
  elapsedTime: number;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function BottomPanel({ liveUpdate, optimal, phase, elapsedTime }: Props) {
  if (!optimal) return null;

  return (
    <div className="glass-panel px-6 py-4 animate-slide-up">
      <div className="flex items-center justify-between gap-8">
        {/* Ambulance Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">🚑</div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Dispatched Unit</p>
            <p className="text-white font-bold">{optimal.ambulance.name}</p>
            <p className="text-xs text-gray-400">{optimal.ambulance.id}</p>
          </div>
        </div>

        {/* Live Stats */}
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-xs text-gray-500">Speed</p>
            <p className="text-xl font-mono font-bold text-pulse-cyan">
              {liveUpdate?.speed ?? optimal.ambulance.speed} <span className="text-xs text-gray-400">km/h</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Distance</p>
            <p className="text-xl font-mono font-bold text-pulse-blue">
              {liveUpdate?.distanceRemaining?.toFixed(1) ?? '—'} <span className="text-xs text-gray-400">km</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Elapsed</p>
            <p className="text-xl font-mono font-bold text-white">{fmt(elapsedTime)}</p>
          </div>
        </div>

        {/* Phase */}
        <div className="text-center">
          <p className="text-xs text-gray-500">Status</p>
          <p className={`text-sm font-bold uppercase tracking-wider ${
            phase === 'enroute-user' ? 'text-amber-400' :
            phase === 'pickup' ? 'text-pulse-cyan' :
            phase === 'enroute-hospital' ? 'text-pulse-blue' :
            phase === 'arrived' ? 'text-pulse-green' : 'text-gray-400'
          }`}>
            {phase === 'enroute-user' && '→ En Route to Patient'}
            {phase === 'pickup' && '✓ Patient Picked Up'}
            {phase === 'enroute-hospital' && '→ Heading to Hospital'}
            {phase === 'arrived' && '✓ Arrived at Hospital'}
            {phase === 'dispatched' && '⏳ Dispatched'}
          </p>
        </div>

        {/* Hospital Info */}
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider text-right">Destination</p>
            <p className="text-white font-bold text-right">{optimal.hospital.name}</p>
            <p className="text-xs text-gray-400 text-right">{optimal.hospital.availableBeds} beds available</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-2xl">🏥</div>
        </div>
      </div>
    </div>
  );
}
