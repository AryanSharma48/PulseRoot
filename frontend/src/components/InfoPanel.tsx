interface Props { title: string; value: string | number; subtitle?: string; color?: string; }

export default function InfoPanel({ title, value, subtitle, color = 'text-white' }: Props) {
  const displayValue = typeof value === 'number' ? value.toFixed(2) : value;

  return (
    <div className="glass-panel-light p-4 text-center">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{title}</p>
      <p className={`text-2xl font-bold font-mono ${color}`}>{displayValue}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
