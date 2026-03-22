import { useState, useEffect } from 'react';

// ─── Traffic Model (real-world ambulance dispatch patterns) ───────────────────
// Based on studies showing ambulance demand peaks during morning & evening
// rush hours on weekdays, Friday being the heaviest day.

type Level = 'low' | 'medium' | 'high';

interface HourBand {
  label: string;
  level: Level;
}

const HOUR_BANDS: HourBand[] = [
  { label: '12–6 AM', level: 'low' },       // 0-5
  { label: '6–9 AM',  level: 'high' },      // 6-8
  { label: '9–12 PM', level: 'medium' },    // 9-11
  { label: '12–3 PM', level: 'medium' },    // 12-14
  { label: '3–7 PM',  level: 'high' },      // 15-18
  { label: '7–10 PM', level: 'medium' },    // 19-21
  { label: '10 PM–12', level: 'low' },      // 22-23
];

// Per-hour level index (0=low, 1=medium, 2=high)
const HOUR_LEVEL: Level[] = [
  'low','low','low','low','low','low',        // 0-5
  'high','high','high',                       // 6-8
  'medium','medium','medium',                 // 9-11
  'medium','medium','medium',                 // 12-14
  'high','high','high','high',                // 15-18
  'medium','medium','medium',                 // 19-21
  'low','low',                                // 22-23
];

// Weekday modifier: 0=Sun..6=Sat
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
// Weekend = lighter; Friday = heaviest
const DAY_WEIGHT = [0.7, 1.0, 1.0, 1.0, 1.0, 1.2, 0.8];

function getLevel(hour: number, day: number): Level {
  const base = HOUR_LEVEL[hour];
  const w = DAY_WEIGHT[day];
  if (base === 'high' && w >= 1.2) return 'high';
  if (base === 'high' && w < 0.8) return 'medium';
  if (base === 'low' && w > 1.1) return 'medium';
  return base;
}

const LEVEL_CONFIG: Record<Level, { label: string; color: string; barColor: string; glow: string; dot: string }> = {
  low:    { label: 'Low Traffic',    color: 'text-green-400',  barColor: 'bg-green-500',  glow: 'shadow-green-900/60',  dot: 'bg-green-400' },
  medium: { label: 'Moderate Traffic', color: 'text-amber-400', barColor: 'bg-amber-400', glow: 'shadow-amber-900/60', dot: 'bg-amber-400' },
  high:   { label: 'High Traffic',   color: 'text-red-400',    barColor: 'bg-red-500',    glow: 'shadow-red-900/60',   dot: 'bg-red-400' },
};

const BAR_HEIGHT: Record<Level, string> = { low: 'h-2', medium: 'h-4', high: 'h-6' };

export default function TrafficWidget() {
  const [now, setNow] = useState(new Date());

  // Refresh every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const day  = now.getDay();
  const level = getLevel(hour, day);
  const cfg   = LEVEL_CONFIG[level];

  return (
    <div
      className={`glass-panel p-3 sm:p-4 w-64 sm:w-72 animate-fade-in shadow-lg ${cfg.glow}`}
      style={{ backdropFilter: 'blur(16px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🚦</span>
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest font-bold">
            Emergency Traffic
          </span>
        </div>
        {/* Live dot */}
        <div className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${cfg.dot}`} />
          <span className="text-[9px] text-gray-500 uppercase tracking-wider">live</span>
        </div>
      </div>

      {/* Current level badge */}
      <div className={`flex items-center gap-2 mb-3 ${cfg.color}`}>
        <span className="text-lg font-bold">{cfg.label}</span>
      </div>

      {/* Day + time context */}
      <p className="text-[10px] text-gray-500 mb-2">
        {DAY_LABELS[day]} · {hour.toString().padStart(2,'0')}:00 –&nbsp;
        {(hour + 1).toString().padStart(2,'0')}:00
      </p>

      {/* 24-hour bar chart */}
      <div className="flex items-end gap-[2px] h-6 mb-2">
        {HOUR_LEVEL.map((lvl, h) => {
          const isNow = h === hour;
          const bc = LEVEL_CONFIG[lvl].barColor;
          const ht = BAR_HEIGHT[lvl];
          return (
            <div
              key={h}
              className={`flex-1 rounded-sm transition-all ${bc} ${ht} ${
                isNow ? 'ring-1 ring-white/60 brightness-150' : 'opacity-60'
              }`}
              title={`${h}:00 — ${lvl}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[8px] text-gray-600 mb-1 px-0.5">
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>12 AM</span>
      </div>

      {/* Weekly summary */}
      <div className="border-t border-white/10 pt-2 mt-1">
        <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">This week</p>
        <div className="flex items-end gap-1 h-4">
          {DAY_WEIGHT.map((w, d) => {
            const isToday = d === day;
            const ht = w >= 1.1 ? 'h-4' : w >= 0.9 ? 'h-3' : 'h-2';
            return (
              <div key={d} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className={`w-full rounded-sm ${ht} ${
                    isToday
                      ? 'bg-blue-400 ring-1 ring-blue-200/50 brightness-125'
                      : 'bg-white/20'
                  }`}
                />
                <span className={`text-[7px] ${isToday ? 'text-blue-300 font-bold' : 'text-gray-600'}`}>
                  {DAY_LABELS[d].slice(0, 2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer hint */}
      <p className="text-[9px] text-gray-600 mt-2 leading-tight">
        Peak: 6–9 AM &amp; 3–7 PM · Heaviest: Fridays
      </p>
    </div>
  );
}
