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
    return <div className="text-center py-8 text-slate-600 text-sm">No events yet</div>
  }

  return (
    <div className="space-y-1">
      {visible.map(event => {
        const meta      = EVENT_META[event.type] ?? { emoji: '•', label: event.type, color: 'slate' }
        const player    = event.playerId    ? getPlayer(event.playerId)    : null
        const subPlayer = event.subPlayerId ? getPlayer(event.subPlayerId) : null
        const assist    = event.assistPlayerId ? getPlayer(event.assistPlayerId) : null

        return (
          <div
            key={event.id}
            className={cn(
              'flex items-start gap-3 px-3 py-2.5 rounded-xl',
              'bg-slate-800/40 border border-slate-700/30',
              'group transition-colors hover:bg-slate-800/70'
            )}
          >
            <span className="text-lg leading-none mt-0.5">{meta.emoji}</span>
            <span className="text-xs font-mono font-bold text-slate-400 w-8 shrink-0 mt-0.5">
              {formatMinute(event.elapsedSeconds)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {player?.name ?? meta.label}
              </div>
              {/* Assist */}
              {assist && (
                <div className="text-xs text-slate-400 mt-0.5">
                  🎯 {assist.name}
                </div>
              )}
              {/* Substitution: player coming in */}
              {subPlayer && (
                <div className="text-xs text-slate-400 mt-0.5">
                  ← {subPlayer.name}
                </div>
              )}
              {/* Card reason */}
              {event.reason && (
                <div className="text-xs text-slate-500 mt-0.5 italic">{event.reason}</div>
              )}
            </div>
            {onRemove && (
              <button
                onClick={() => onRemove(event.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all text-lg leading-none mt-0.5 shrink-0"
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
