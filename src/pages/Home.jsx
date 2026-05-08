import { useNavigate } from 'react-router-dom'
import { useMatchStore } from '../store/matchStore'
import { useRosterStore } from '../store/rosterStore'
import { useSettingsStore } from '../store/settingsStore'
import { useTheme } from '../hooks/useTheme'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EventLog } from '../components/match/EventLog'
import { formatDate, getMatchResult, getResultColor, cn } from '../lib/utils'
import { PHASE } from '../lib/constants'

export default function Home() {
  const navigate  = useNavigate()
  const { activeMatch, matchHistory, clearActiveMatch } = useMatchStore()
  const { players } = useRosterStore()
  const { teamName } = useSettingsStore()
  const { dark, toggle } = useTheme()

  const recentResults = matchHistory.filter(m => m.phase === PHASE.POST).slice(0, 5)
  const isLive  = activeMatch?.phase === PHASE.LIVE
  const isPre   = activeMatch?.phase === PHASE.PRE
  const isPost  = activeMatch?.phase === PHASE.POST
  const score   = activeMatch?.score ?? { home: 0, away: 0 }

  const wins   = matchHistory.filter(m => getMatchResult(m.score ?? { home: 0, away: 0 }) === 'W').length
  const played = matchHistory.filter(m => m.phase === PHASE.POST).length

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-8 pb-4">
        <div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Football DSS</div>
          <h1 className="text-3xl font-black text-white mt-0.5">{teamName}</h1>
        </div>
        <button
          onClick={toggle}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-lg active:scale-90 transition-all"
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="px-4 space-y-4">

        {/* ── Permanent "Start New Match" CTA ─────────────────────────── */}
        <button
          onClick={() => navigate('/setup')}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-4 text-left active:scale-[0.98] transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-4"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/20 text-2xl shrink-0">
            ⚽
          </div>
          <div>
            <div className="text-white font-black text-lg leading-tight">Start New Match</div>
            <div className="text-emerald-200 text-sm mt-0.5">
              {matchHistory.length > 0 ? 'Last XI pre-loaded' : 'Set up your squad'}
            </div>
          </div>
          <div className="ml-auto text-white/60 text-2xl">›</div>
        </button>

        {/* ── Active match card (if any) ──────────────────────────────── */}
        {activeMatch && (
          <Card className={cn(
            'overflow-hidden border-2',
            isLive ? 'border-red-500/50 bg-red-950/20'
            : isPre ? 'border-emerald-500/30 bg-emerald-950/10'
            : 'border-slate-600/40'
          )}>
            <CardBody>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isLive && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/20 border border-red-500/30 rounded-full px-2.5 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      LIVE
                    </span>
                  )}
                  {isPre  && <Badge color="emerald">PRE-MATCH</Badge>}
                  {isPost && <Badge color="slate">FULL TIME</Badge>}
                </div>
                {isPost && (
                  <button
                    onClick={() => clearActiveMatch()}
                    className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    Dismiss ✕
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-lg">vs {activeMatch.opponent}</div>
                  <div className="text-xs text-slate-400">{activeMatch.formation} · {formatDate(activeMatch.date)}</div>
                </div>
                {(isLive || isPost) && (
                  <div className="text-3xl font-black text-white">{score.home}–{score.away}</div>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="flex-1"
                  variant={isLive ? 'danger' : 'primary'}
                  onClick={() => navigate('/live')}
                >
                  {isLive ? '⚽ Live Tracker' : isPre ? '▶ Continue Setup' : '📊 Match Summary'}
                </Button>
                {(isLive || isPost) && (
                  <Button size="sm" variant="ghost" onClick={() => navigate('/stats')}>Stats</Button>
                )}
              </div>

              {isLive && activeMatch.events.length > 0 && (
                <div className="mt-3">
                  <EventLog events={activeMatch.events} compact />
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* ── Quick stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center py-4">
            <div className="text-2xl font-black text-white">{players.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">Players</div>
          </Card>
          <Card className="text-center py-4">
            <div className="text-2xl font-black text-emerald-400">{wins}</div>
            <div className="text-xs text-slate-500 mt-0.5">Wins</div>
          </Card>
          <Card className="text-center py-4">
            <div className="text-2xl font-black text-white">{played}</div>
            <div className="text-xs text-slate-500 mt-0.5">Matches</div>
          </Card>
        </div>

        {/* ── Recent results ───────────────────────────────────────────── */}
        {recentResults.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Results</h2>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="divide-y divide-slate-700/30">
                {recentResults.map(match => {
                  const s = match.score ?? { home: 0, away: 0 }
                  const r = getMatchResult(s)
                  return (
                    <div key={match.id} className="flex items-center gap-3 py-3">
                      <span className={cn('w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black', {
                        W: 'bg-emerald-500/20 text-emerald-400',
                        L: 'bg-red-500/20 text-red-400',
                        D: 'bg-amber-500/20 text-amber-400',
                      }[r])}>
                        {r}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">vs {match.opponent}</div>
                        <div className="text-xs text-slate-500">{formatDate(match.date)}{match.competition ? ` · ${match.competition}` : ''}</div>
                      </div>
                      <div className="text-base font-black text-white">{s.home}–{s.away}</div>
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>
        )}

        {/* ── Form strip ───────────────────────────────────────────────── */}
        {recentResults.length > 0 && (
          <div className="flex items-center gap-2 pb-2">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest shrink-0">Form</span>
            <div className="flex gap-1.5">
              {[...recentResults].reverse().map(m => {
                const r = getMatchResult(m.score ?? { home: 0, away: 0 })
                return (
                  <span key={m.id} className={cn('w-7 h-7 flex items-center justify-center rounded-full text-xs font-black', {
                    W: 'bg-emerald-500 text-white',
                    L: 'bg-red-500 text-white',
                    D: 'bg-amber-500 text-white',
                  }[r])}>
                    {r}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
