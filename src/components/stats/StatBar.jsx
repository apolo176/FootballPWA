import { cn } from '../../lib/utils'

export function StatBar({ label, value, max, color = 'emerald', unit = '' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const colorMap = {
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    amber: 'bg-amber-400',
    sky: 'bg-sky-500',
    violet: 'bg-violet-500',
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold text-white tabular-nums">{value}{unit}</span>
      </div>
      <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', colorMap[color] ?? colorMap.emerald)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function MiniStat({ label, value, sub, color }) {
  const colorMap = {
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
    sky: 'text-sky-400',
    slate: 'text-slate-300',
    yellow: 'text-yellow-300',
  }

  return (
    <div className="flex flex-col items-center gap-0.5 py-3 px-2 bg-slate-800/40 rounded-2xl">
      <span className={cn('text-3xl font-black tabular-nums', colorMap[color] ?? colorMap.slate)}>{value}</span>
      <span className="text-xs font-semibold text-slate-400 text-center leading-tight">{label}</span>
      {sub && <span className="text-xs text-slate-600">{sub}</span>}
    </div>
  )
}
