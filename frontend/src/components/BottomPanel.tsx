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
    <div className="glass-panel p-4 sm:px-6 sm:py-4 animate-slide-up w-full">
      <div className="flex flex-wrap items-center justify-between sm:justify-between gap-y-4 gap-x-2 sm:gap-6 text-center sm:text-left">
        
        {/* Mobile Row 1 / Desktop Col 2: Ambulance Info */}
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">🚑</div>
          <div className="text-center sm:text-left">
            <p className="text-[10px] sm:text-xs text-blue-400 uppercase tracking-widest font-bold">Dispatched Unit</p>
            <p className="text-white font-bold text-sm sm:text-base">{optimal.ambulance.name}</p>
          </div>
        </div>

        {/* Mobile Row 2 Left / Desktop Col 1: Source Hospital */}
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 w-[45%] sm:w-auto order-2 sm:order-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-lg">🏥</div>
          <div className="text-center sm:text-left">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">From Hospital</p>
            <p className="text-white font-semibold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{optimal.sourceHospital?.name ?? '—'}</p>
          </div>
        </div>

        {/* Mobile Row 2 Right / Desktop Col 5: Destination Hospital */}
        <div className="flex flex-col sm:flex-row-reverse items-center gap-1 sm:gap-3 w-[45%] sm:w-auto order-3 sm:order-5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-lg">🏥</div>
          <div className="text-center sm:text-right">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Destination</p>
            <p className="text-white font-semibold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{optimal.hospital.name}</p>
          </div>
        </div>

        {/* Mobile Row 3 / Desktop Col 4: Phase */}
        <div className="text-center w-full sm:w-auto order-4 sm:order-4 mt-1 sm:mt-0 bg-white/5 sm:bg-transparent rounded-lg py-1 sm:py-0">
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Status</p>
          <p className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${
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

        {/* Mobile Row 4 / Desktop Col 3: Live Stats */}
        <div className="flex justify-around gap-2 sm:gap-6 w-full sm:w-auto order-5 sm:order-3">
          <div className="text-center">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Speed</p>
            <p className="text-base sm:text-lg font-mono font-bold text-pulse-cyan drop-shadow-lg">
              {liveUpdate?.speed ?? optimal.ambulance.speed} <span className="text-[10px] sm:text-xs text-gray-400">km/h</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Distance</p>
            <p className="text-base sm:text-lg font-mono font-bold text-pulse-blue drop-shadow-lg">
              {liveUpdate?.distanceRemaining?.toFixed(1) ?? '—'} <span className="text-[10px] sm:text-xs text-gray-400">km</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Elapsed</p>
            <p className="text-base sm:text-lg font-mono font-bold text-white drop-shadow-lg">{fmt(elapsedTime)}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
