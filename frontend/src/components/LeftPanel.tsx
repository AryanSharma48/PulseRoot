import { useState } from 'react';
import { EmergencyType, Coordinates, RouteOption } from '../types';
import DecisionModal from './DecisionModal';
import { formatNumber, formatOptionalNumber } from '../utils/format';

interface Props {
  onTrigger: (type?: EmergencyType) => void;
  isActive: boolean;
  isLoading: boolean;
  ambulanceCount: number;
  estimatedTime: number | null;
  onReset: () => void;
  pinnedLocation: Coordinates | null;
  locationMode: 'none' | 'gps' | 'pin';
  onUseMyLocation: () => void;
  onClearPin: () => void;
  optimal: RouteOption | null;
  nearest: RouteOption | null;
}

const TYPES: { value: EmergencyType; label: string; icon: string }[] = [
  { value: 'cardiac', label: 'Cardiac', icon: '❤️' },
  { value: 'trauma', label: 'Trauma', icon: '🩹' },
  { value: 'respiratory', label: 'Respiratory', icon: '🫁' },
  { value: 'general', label: 'General', icon: '🏥' },
];

export default function LeftPanel({
  onTrigger, isActive, isLoading, ambulanceCount, estimatedTime,
  onReset, pinnedLocation, locationMode, onUseMyLocation, onClearPin,
  optimal, nearest
}: Props) {
  const hasLocation = pinnedLocation !== null;
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  return (
    <div className="glass-panel p-4 sm:p-5 w-full sm:w-80 animate-slide-right space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-xl">🚨</div>
        <div>
          <h1 className="text-lg font-bold text-white">PulseRoute</h1>
          <p className="text-xs text-gray-400">AI Emergency Response</p>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {!isActive ? (
        <>
          {/* Location Selection */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-widest">📍 Emergency Location</p>

            {hasLocation ? (
              <div className="glass-panel-light px-3 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">
                    {locationMode === 'gps' ? '📡 GPS Location' : '📍 Pinned Location'}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {formatNumber(pinnedLocation!.lat)}, {formatNumber(pinnedLocation!.lng)}
                  </p>
                </div>
                <button onClick={onClearPin} className="text-xs text-red-400 hover:text-red-300 px-2">✕</button>
              </div>
            ) : (
              <div className="space-y-2">
                <button onClick={onUseMyLocation}
                  className="w-full glass-panel-light px-3 py-2.5 text-sm flex items-center gap-2 hover:bg-white/10 transition-all text-gray-300">
                  <span>📡</span> Use My Location
                </button>
                <p className="text-xs text-gray-500 text-center">— or click anywhere on the map —</p>
              </div>
            )}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Emergency Type */}
          <p className="text-xs text-gray-400 uppercase tracking-widest">Emergency Type</p>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map(t => (
              <button key={t.value} onClick={() => onTrigger(t.value)} disabled={isLoading || !hasLocation}
                className="glass-panel-light px-3 py-2.5 text-sm flex items-center gap-2 hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <span>{t.icon}</span><span className="text-gray-300">{t.label}</span>
              </button>
            ))}
          </div>

          <button onClick={() => onTrigger()} disabled={isLoading || !hasLocation}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
              hasLocation
                ? 'bg-gradient-to-r from-red-600 to-red-500 glow-red hover:from-red-500 hover:to-red-400'
                : 'bg-gray-700'
            }`}>
            {isLoading ? 'Dispatching...' : !hasLocation ? 'Set Location First' : 'TRIGGER EMERGENCY'}
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <button onClick={onReset}
            className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 font-medium hover:bg-red-500/10 transition-all">
            Cancel Ambulance
          </button>


        </div>
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500">Available Units</p>
          <p className="text-2xl font-bold text-pulse-cyan">{ambulanceCount}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Est. Response</p>
          <p className="text-2xl font-bold text-pulse-green">
            {formatOptionalNumber(estimatedTime)}m
          </p>
        </div>
      </div>
    </div>
  );
}
