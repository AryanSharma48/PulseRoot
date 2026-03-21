import { RouteOption } from '../types';

interface Props {
  optimal: RouteOption | null;
  nearest: RouteOption | null;
}

export default function RightPanel({ optimal, nearest }: Props) {
  if (!optimal) return null;

  const timeSaved = nearest ? Math.round((nearest.totalTime - optimal.totalTime) * 10) / 10 : 0;

  return (
    <div className="glass-panel p-4 sm:p-5 w-full sm:w-80 animate-fade-in space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div className="flex items-center gap-2">
        <span className="text-lg">🧠</span>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Decision Engine</h2>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {nearest && !nearest.isOptimal && (
        <div className="glass-panel-light p-4 space-y-3 opacity-60">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 uppercase">Nearest Unit</span>
            <span className="status-pill bg-amber-500/20 text-amber-400">Not Optimal</span>
          </div>
          <p className="text-white font-semibold">{nearest.ambulance.name}</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Pickup ETA</span>
            <span className="text-white font-mono">{nearest.pickupETA} min</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Time</span>
            <span className="text-white font-mono">{nearest.totalTime} min</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Hospital</span>
            <span className="text-white text-right text-xs">{nearest.hospital.name}</span>
          </div>
        </div>
      )}

      <div className="glass-panel-light p-4 space-y-3 border-pulse-green/30 border glow-green">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400 uppercase">AI Selected</span>
          <span className="status-pill bg-green-500/20 text-green-400">✓ Optimal</span>
        </div>
        <p className="text-white font-semibold">{optimal.ambulance.name}</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Pickup ETA</span>
          <span className="text-pulse-green font-mono font-bold">{optimal.pickupETA} min</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total Time</span>
          <span className="text-pulse-green font-mono font-bold">{optimal.totalTime} min</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Hospital</span>
          <span className="text-white text-right text-xs">{optimal.hospital.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Distance</span>
          <span className="text-white font-mono">{optimal.distance} km</span>
        </div>
      </div>

      {timeSaved > 0 && (
        <div className="text-center py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-green-400 font-bold text-lg">⚡ {timeSaved} min faster</p>
          <p className="text-xs text-gray-400">than nearest ambulance</p>
        </div>
      )}
    </div>
  );
}
