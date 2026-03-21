interface Props {
  onTrigger: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export default function EmergencyButton({ onTrigger, isLoading, disabled }: Props) {
  return (
    <button
      onClick={onTrigger}
      disabled={disabled || isLoading}
      className="relative group w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-lg
        glow-red hover:from-red-500 hover:to-red-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Dispatching...
        </span>
      ) : (
        '🚨 TRIGGER EMERGENCY'
      )}
    </button>
  );
}
