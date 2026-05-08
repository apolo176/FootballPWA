import { cn } from '../../lib/utils'

const COLOR_MAP = {
  emerald: 'bg-emerald-500',
  red:     'bg-red-500',
  amber:   'bg-amber-400',
  sky:     'bg-sky-500',
  violet:  'bg-violet-500',
  yellow:  'bg-yellow-400',
  slate:   'bg-slate-400',
}

/**
 * CSS-only horizontal bar chart. No external dependencies.
 *
 * data: Array<{ label: string, value: number, color?: string, emoji?: string }>
 */
export function HBarChart({ data = [], color = 'emerald', emptyMessage = 'No data yet' }) {
  if (!data.length || data.every(d => d.value === 0)) {
    return <p className="text-center text-slate-400 text-sm py-4">{emptyMessage}</p>
  }
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="space-y-2.5">
      {data.filter(d => d.value > 0).map(item => {
        const pct = Math.round((item.value / max) * 100)
        const barColor = COLOR_MAP[item.color ?? color] ?? COLOR_MAP.emerald
        return (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                {item.emoji && <span>{item.emoji}</span>}
                {item.label}
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{item.value}</span>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700', barColor)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Leaderboard — ranked list with inline bar.
 * data: Array<{ name: string, value: number, sub?: string, number?: number }>
 */
export function Leaderboard({ data = [], color = 'emerald', emptyMessage = 'No data yet' }) {
  if (!data.length || data.every(d => d.value === 0)) {
    return <p className="text-center text-slate-400 text-sm py-4">{emptyMessage}</p>
  }
  const max = Math.max(...data.map(d => d.value), 1)
  const barColor = COLOR_MAP[color] ?? COLOR_MAP.emerald
  const top = data.filter(d => d.value > 0).slice(0, 8)

  return (
    <div className="space-y-2">
      {top.map((item, i) => (
        <div key={item.name} className="flex items-center gap-3">
          {/* Rank */}
          <span className={cn(
            'w-6 h-6 flex items-center justify-center rounded-full text-xs font-black shrink-0',
            i === 0 ? 'bg-amber-400 text-white' :
            i === 1 ? 'bg-slate-300 dark:bg-slate-500 text-slate-800 dark:text-white' :
            i === 2 ? 'bg-amber-700 text-white' :
                     'bg-slate-100 dark:bg-slate-700/60 text-slate-500',
          )}>
            {i + 1}
          </span>
          {/* Number badge */}
          {item.number !== undefined && (
            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold font-mono text-slate-600 dark:text-slate-300 shrink-0">
              {item.number ?? '?'}
            </span>
          )}
          {/* Name + bar */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-0.5">
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.name}</span>
              <span className="text-sm font-black text-slate-900 dark:text-white ml-2 shrink-0">{item.value}</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', barColor)}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            {item.sub && <div className="text-[10px] text-slate-400 mt-0.5">{item.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
