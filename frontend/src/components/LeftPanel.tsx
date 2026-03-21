import { EmergencyType } from '../types';

interface Props {
  onTrigger: (type?: EmergencyType) => void;
  isActive: boolean;
  isLoading: boolean;
  ambulanceCount: number;
  estimatedTime: number | null;
  onReset: () => void;
}

const TYPES: { value: EmergencyType; label: string; icon: string }[] = [
  { value: 'cardiac', label: 'Cardiac', icon: '❤️' },
  { value: 'trauma', label: 'Trauma', icon: '🩹' },
  { value: 'respiratory', label: 'Respiratory', icon: '🫁' },
  { value: 'general', label: 'General', icon: '🏥' },
];

export default function LeftPanel({ onTrigger, isActive, isLoading, ambulanceCount, estimatedTime, onReset }: Props) {
  return (
    <div className="glass-panel p-5 w-80 animate-slide-right space-y-5">
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
          <p className="text-xs text-gray-400 uppercase tracking-widest">Emergency Type</p>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map(t => (
              <button key={t.value} onClick={() => onTrigger(t.value)} disabled={isLoading}
                className="glass-panel-light px-3 py-2.5 text-sm flex items-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50">
                <span>{t.icon}</span><span className="text-gray-300">{t.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => onTrigger()} disabled={isLoading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-lg glow-red hover:from-red-500 hover:to-red-400 transition-all active:scale-95 disabled:opacity-50">
            {isLoading ? '⏳ Dispatching...' : '🚨 TRIGGER EMERGENCY'}
          </button>
        </>
      ) : (
        <button onClick={onReset}
          className="w-full py-3 rounded-xl border border-white/20 text-gray-300 font-medium hover:bg-white/5 transition-all">
          🔄 Reset System
        </button>
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
            {estimatedTime ? `${estimatedTime}m` : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
