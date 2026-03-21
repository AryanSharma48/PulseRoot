import { useEmergency } from './hooks/useEmergency';
import MapView from './components/MapView';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import BottomPanel from './components/BottomPanel';

export default function App() {
  const em = useEmergency();
  const availableCount = em.ambulances.filter(a => a.status === 'available').length;
  const nearest = em.response?.alternatives[0] ?? null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-pulse-dark">
      {/* Map Layer */}
      <MapView
        ambulances={em.ambulances}
        hospitals={em.hospitals}
        userLocation={em.userLocation}
        optimalRoute={em.response?.optimal ?? null}
        alternatives={em.response?.alternatives ?? []}
        isActive={em.isActive}
      />

      {/* Left Panel */}
      <div className="absolute top-4 left-4 z-10">
        <LeftPanel
          onTrigger={em.trigger}
          isActive={em.isActive}
          isLoading={em.isLoading}
          ambulanceCount={availableCount}
          estimatedTime={em.response ? em.response.optimal.totalTime : null}
          onReset={em.reset}
        />
      </div>

      {/* Right Panel */}
      {em.isActive && em.response && (
        <div className="absolute top-4 right-4 z-10">
          <RightPanel optimal={em.response.optimal} nearest={nearest} />
        </div>
      )}

      {/* Bottom Panel */}
      {em.isActive && em.response && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <BottomPanel
            liveUpdate={em.liveUpdate}
            optimal={em.response.optimal}
            phase={em.phase}
            elapsedTime={em.elapsedTime}
          />
        </div>
      )}

      {/* Top Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        {em.phase !== 'idle' && em.phase !== 'arrived' && (
          <div className="glass-panel px-6 py-2 flex items-center gap-3 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-white">LIVE — Emergency Active</span>
            <span className="text-xs text-gray-400 font-mono">{em.response?.id}</span>
          </div>
        )}
        {em.phase === 'arrived' && (
          <div className="glass-panel px-6 py-2 flex items-center gap-3 animate-fade-in glow-green">
            <span className="text-green-400 font-bold text-sm">✓ Patient Delivered Successfully</span>
          </div>
        )}
      </div>
    </div>
  );
}
