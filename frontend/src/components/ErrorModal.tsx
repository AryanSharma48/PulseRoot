interface Props {
  message: string;
  onClose: () => void;
}

export default function ErrorModal({ message, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative glass-panel p-8 max-w-md w-full mx-4 text-center glow-red" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center text-4xl">
          🚫
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Ambulances Nearby</h2>
        <p className="text-gray-400 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 rounded-xl text-white font-semibold hover:from-red-500 hover:to-red-400 transition-all active:scale-95"
        >
          OK, Got It
        </button>
      </div>
    </div>
  );
}
