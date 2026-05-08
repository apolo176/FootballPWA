import { EVENT_META } from '../../lib/constants'
import { formatMinute } from '../../lib/utils'
import { useRosterStore } from '../../store/rosterStore'
import { cn } from '../../lib/utils'

const HIDDEN = new Set(['match_start', 'match_end', 'half_time', 'second_half'])

export function EventLog({ events, onRemove, compact = false }) {
  const { getPlayer } = useRosterStore()

  const visible = [...events]
    .filter(e => !HIDDEN.has(e.type))
    .sort((a, b) => b.elapsedSeconds - a.elapsedSeconds)
    .slice(0, compact ? 5 : undefined)

  if (visible.length === 0) {
    return <div className="text-center py-8 text-slate-400 text-sm">No hay eventos aún</div>
  }

  return (
    <div className="space-y-1">
      {visible.map(event => {
        const meta      = EVENT_META[event.type] ?? { emoji: '•', label: event.type }
        const player    = event.playerId    ? getPlayer(event.playerId)    : null
        const subPlayer = event.subPlayerId ? getPlayer(event.subPlayerId) : null
        const assist    = event.assistPlayerId ? getPlayer(event.assistPlayerId) : null

        return (
          <div
            key={event.id}
            className={cn(
              'flex items-start gap-3 px-3 py-2.5 rounded-xl group transition-colors',
              'bg-white dark:bg-slate-800/40',
              'border border-slate-200 dark:border-slate-700/30',
              'hover:bg-slate-50 dark:hover:bg-slate-800/70',
            )}
          >
            <span className="text-lg leading-none mt-0.5">{meta.emoji}</span>
            <span className="text-xs font-mono font-bold text-slate-400 w-8 shrink-0 mt-0.5">
              {formatMinute(event.elapsedSeconds)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {player?.name ?? meta.label}
              </div>
              {assist && (
                <div className="text-xs text-slate-500 mt-0.5">🎯 {assist.name}</div>
              )}
              {subPlayer && (
                <div className="text-xs text-slate-500 mt-0.5">← {subPlayer.name}</div>
              )}
              {event.reason && (
                <div className="text-xs text-slate-400 mt-0.5 italic">{event.reason}</div>
              )}
              {event.goalType && (
                <div className="text-xs text-slate-400 mt-0.5">{event.goalType}</div>
              )}
            </div>
            {onRemove && (
              <button
                onClick={() => onRemove(event.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all text-lg leading-none mt-0.5 shrink-0"
              >
                ×
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
