import { EVENT_META } from '../../lib/constants'
import { formatMinute } from '../../lib/utils'
import { cn } from '../../lib/utils'

const MARKER_EVENTS = new Set(['match_start', 'half_time', 'second_half', 'match_end'])

export function Timeline({ timeline }) {
  if (!timeline?.length) return (
    <div className="text-center py-8 text-slate-600 text-sm">No events recorded</div>
  )

  return (
    <div className="relative pl-8">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-700" />

      <div className="space-y-0.5">
        {timeline.map((event) => {
          const meta     = EVENT_META[event.type] ?? { emoji: '•', label: event.type, color: 'slate' }
          const isMarker = MARKER_EVENTS.has(event.type)

          if (isMarker) {
            return (
              <div key={event.id} className="relative flex items-center gap-3 py-2.5">
                <div className="absolute -left-5 w-2 h-2 rounded-full bg-slate-500 border-2 border-slate-900" />
                <span className="text-xs text-slate-500 font-mono">{formatMinute(event.elapsedSeconds)}</span>
                <span className="text-xs text-slate-400 font-semibold">{meta.emoji} {meta.label}</span>
              </div>
            )
          }

          return (
            <div key={event.id} className="relative flex items-start gap-3 py-2">
              <div className="absolute -left-5 flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-sm shrink-0">
                {meta.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-mono text-slate-400 shrink-0">
                    {formatMinute(event.elapsedSeconds)}
                  </span>
                  <span className="text-sm font-semibold text-white truncate">
                    {event.playerName ?? meta.label}
                  </span>
                </div>
                {/* Assist */}
                {event.assistPlayerName && (
                  <div className="text-xs text-emerald-400/70 mt-0.5 ml-8">
                    🎯 {event.assistPlayerName}
                  </div>
                )}
                {/* Substitution */}
                {event.subPlayerName && (
                  <div className="text-xs text-violet-400/70 mt-0.5 ml-8">
                    ↔ {event.subPlayerName}
                  </div>
                )}
                {/* Card reason */}
                {event.reason && (
                  <div className="text-xs text-slate-500 italic mt-0.5 ml-8">
                    {event.reason}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
