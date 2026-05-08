import { formatTime } from '../../lib/utils'
import { PHASE } from '../../lib/constants'

export function ScoreBoard({ elapsed, match, onPauseResume, isTimerRunning, onEndHalf, onSecondHalf, onFinish }) {
  if (!match) return null
  const score  = match.score ?? { home: 0, away: 0 }
  const isLive = match.phase === PHASE.LIVE
  const isPost = match.phase === PHASE.POST

  const hasHalfTime   = match.events.some(e => e.type === 'half_time')
  const hasSecondHalf = match.events.some(e => e.type === 'second_half')

  return (
    <div className="bg-slate-900 dark:bg-slate-950 border-b border-slate-700 dark:border-slate-700/50 shrink-0">
      {/* Teams + Score */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-3">
        <div className="flex-1 text-center">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            {match.venue === 'home' ? '🏠 Nosotros' : 'Nosotros'}
          </div>
        </div>

        <div className="flex items-center gap-1 bg-black/40 rounded-2xl px-4 py-2">
          <span className="score-digit text-5xl text-white">{score.home}</span>
          <span className="text-2xl text-slate-400 mx-1">–</span>
          <span className="score-digit text-5xl text-white">{score.away}</span>
        </div>

        <div className="flex-1 text-center">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest truncate">
            {match.opponent}
          </div>
        </div>
      </div>

      {/* Timer row */}
      <div className="flex items-center justify-center gap-3 pb-3 px-4">
        {isLive && (
          <>
            <button
              onClick={onPauseResume}
              className="flex items-center gap-1.5 bg-slate-700/60 rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-white active:scale-95 transition-all"
            >
              {isTimerRunning
                ? <span className="text-amber-400">⏸</span>
                : <span className="text-emerald-400">▶</span>
              }
              <span className={isTimerRunning ? 'text-emerald-400' : 'text-slate-400'}>
                {formatTime(elapsed)}
              </span>
              {isTimerRunning && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" />}
            </button>

            {!hasHalfTime && (
              <button onClick={onEndHalf}
                className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl px-3 py-1.5 font-bold active:scale-95 transition-all">
                HT
              </button>
            )}
            {hasHalfTime && !hasSecondHalf && (
              <button onClick={onSecondHalf}
                className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl px-3 py-1.5 font-bold active:scale-95 transition-all">
                2ª ▶
              </button>
            )}
            {hasSecondHalf && (
              <button onClick={onFinish}
                className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl px-3 py-1.5 font-bold active:scale-95 transition-all">
                Final 🏁
              </button>
            )}
          </>
        )}
        {isPost && (
          <div className="flex items-center gap-2 text-sm text-slate-400 font-mono">
            <span>Tiempo Final</span>
            <span className="font-bold text-white">{formatTime(elapsed)}</span>
            <span className="bg-slate-700 text-slate-300 rounded-lg px-2 py-0.5 text-xs">FT</span>
          </div>
        )}
      </div>

      {match.competition && (
        <div className="text-center pb-2 text-xs text-slate-500">{match.competition}</div>
      )}
    </div>
  )
}
