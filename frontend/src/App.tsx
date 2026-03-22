import { useState, useEffect } from 'react';
import { useEmergency } from './hooks/useEmergency';
import MapView from './components/MapView';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import BottomPanel from './components/BottomPanel';
import ErrorModal from './components/ErrorModal';


export default function App() {
  const em = useEmergency();
  const availableCount = em.ambulances.filter(a => a.status === 'available').length;
  const nearest = em.response?.alternatives[0] ?? null;
  const [showPanels, setShowPanels] = useState(true);

  // Auto-show panels when an emergency becomes active
  useEffect(() => {
    if (em.isActive) setShowPanels(true);
  }, [em.isActive]);

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-pulse-dark">
      <MapView
        ambulances={em.ambulances}
        hospitals={em.hospitals}
        userLocation={em.userLocation}
        pinnedLocation={em.pinnedLocation}
        optimalRoute={em.response?.optimal ?? null}
        alternatives={em.response?.alternatives ?? []}
        isActive={em.isActive}
        onMapClick={em.setPin}
      />

      <div className={`sm:block ${showPanels ? 'block' : 'hidden'}`}>
        <div className="absolute top-4 left-4 right-4 sm:right-auto z-10">
          <LeftPanel
            onTrigger={em.trigger}
            isActive={em.isActive}
            isLoading={em.isLoading}
            ambulanceCount={availableCount}
            estimatedTime={em.response ? em.response.optimal.totalTime : null}
            onReset={em.reset}
            pinnedLocation={em.pinnedLocation}
            locationMode={em.locationMode}
            onUseMyLocation={em.useMyLocation}
            onClearPin={em.clearPin}
            optimal={em.response?.optimal ?? null}
            nearest={nearest}
          />
        </div>

        {em.isActive && em.response && (
          <div className="hidden sm:block absolute top-[22rem] sm:top-4 left-4 sm:left-auto right-4 z-10 pb-4">
            <RightPanel optimal={em.response.optimal} nearest={nearest} />
          </div>
        )}

        {em.isActive && em.response && (
          <div className="absolute bottom-24 sm:bottom-4 left-4 right-4 z-10 overflow-hidden">
            <BottomPanel
              liveUpdate={em.liveUpdate}
              optimal={em.response.optimal}
              phase={em.phase}
              elapsedTime={em.elapsedTime}
              bookingTime={em.bookingTime}
            />
          </div>
        )}
      </div>

      <div className={`absolute top-4 sm:top-4 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-20 pointer-events-none justify-end ${showPanels ? 'hidden sm:flex' : 'flex'}`}>
        {em.phase !== 'idle' && em.phase !== 'arrived' && (
          <div className="glass-panel px-4 sm:px-6 py-2 flex items-center gap-2 sm:gap-3 animate-fade-in shadow-lg pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-white">LIVE</span>
            <span className="hidden sm:inline text-xs text-gray-400 font-mono">{em.response?.id}</span>
          </div>
        )}
        {em.phase === 'arrived' && (
          <div className="glass-panel px-4 sm:px-6 py-2 flex items-center gap-2 sm:gap-3 animate-fade-in glow-green shadow-lg pointer-events-auto">
            <span className="text-green-400 font-bold text-xs sm:text-sm">✓ Arrived</span>
          </div>
        )}
      </div>

      {/* Mobile Toggle Bar */}
      <div className="sm:hidden absolute bottom-6 left-4 right-4 z-30">
        <button
          onClick={() => setShowPanels(!showPanels)}
          className={`w-full py-3 rounded-xl shadow-xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 ${
            showPanels 
              ? 'bg-pulse-dark/80 backdrop-blur-md border border-white/10 text-gray-300 hover:text-white'
              : 'bg-gradient-to-r from-red-600 to-red-500 text-white glow-red'
          }`}
        >
          {showPanels ? (
            <span>Show Full Map</span>
          ) : (
            <span>View Details / Controls</span>
          )}
        </button>
      </div>

      {em.errorMessage && (
        <ErrorModal message={em.errorMessage} onClose={em.clearError} />
      )}
    </div>
  );
}
