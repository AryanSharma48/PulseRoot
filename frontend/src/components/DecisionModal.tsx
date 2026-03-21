import type { RouteOption } from '../types';

interface Props {
  optimal: RouteOption;
  nearest: RouteOption | null;
  onClose: () => void;
}

export default function DecisionModal({ optimal, nearest, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative glass-panel w-full sm:max-w-md mx-0 sm:mx-4 rounded-b-none sm:rounded-2xl glow-blue animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-2xl sm:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <h2 className="text-lg font-bold text-white tracking-wide">Decision Engine</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-gray-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* AI Selected */}
          <div className="glass-panel-light p-4 space-y-3 border border-pulse-green/40 glow-green relative overflow-hidden">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] sm:text-xs text-green-400 uppercase tracking-widest font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pulse-green shadow-[0_0_8px_#10b981] animate-pulse"></span>
                AI Selected
              </span>
              <span className="status-pill bg-green-500/20 text-green-400 text-[10px] border border-green-500/30 shadow-lg">✓ Optimal</span>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Unit Delta</p>
              <p className="text-white font-bold text-xl">{optimal.ambulance.name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 bg-black/20 p-3 rounded-xl border border-white/5">
              <div>
                <span className="block text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Pickup ETA</span>
                <span className="text-pulse-green font-mono font-bold text-base">{optimal.pickupETA.toFixed(1)} <span className="text-[10px] text-gray-400">min</span></span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Total Time</span>
                <span className="text-pulse-green font-mono font-bold text-base">{optimal.totalTime.toFixed(1)} <span className="text-[10px] text-gray-400">min</span></span>
              </div>
              <div className="col-span-2">
                <span className="block text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Hospital</span>
                <span className="text-white text-sm font-semibold">{optimal.hospital.name}</span>
              </div>
            </div>
          </div>

          {/* Nearest Unit */}
          {nearest && !nearest.isOptimal && (
            <div className="glass-panel-light p-4 space-y-3 opacity-70 border border-white/5 relative bg-white/5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] sm:text-xs text-amber-500 uppercase tracking-widest font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
                  Nearest Unit
                </span>
                <span className="status-pill bg-amber-500/20 text-amber-400 text-[10px] border border-amber-500/20">Not Optimal</span>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Unit Delta</p>
                <p className="text-gray-300 font-bold text-lg">{nearest.ambulance.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 bg-black/20 p-3 rounded-xl border border-white/5">
                <div>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Pickup ETA</span>
                  <span className="text-gray-300 font-mono font-bold text-sm">{nearest.pickupETA.toFixed(1)} <span className="text-[10px]">min</span></span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Total Time</span>
                  <span className="text-gray-300 font-mono font-bold text-sm">{nearest.totalTime.toFixed(1)} <span className="text-[10px]">min</span></span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Hospital</span>
                  <span className="text-gray-400 text-sm font-medium">{nearest.hospital.name}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
