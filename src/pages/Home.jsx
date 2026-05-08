import { useState } from 'react'
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
import { PHASE, PLAYER_STATUS } from '../lib/constants'

// ── Competition card (multi-competition mode) ─────────────────────────────

function CompetitionCard({ competition, matches, onClick }) {
  const finished = matches.filter(m => m.phase === PHASE.POST)
  const record   = finished.reduce((acc, m) => {
    acc[getMatchResult(m.score ?? { home: 0, away: 0 })]++
    return acc
  }, { W: 0, D: 0, L: 0 })
  const gf = finished.reduce((s, m) => s + (m.score?.home ?? 0), 0)
  const ga = finished.reduce((s, m) => s + (m.score?.away ?? 0), 0)

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 hover:border-emerald-400/50 active:scale-[0.98] transition-all"
    >
      <div className="font-black text-slate-900 dark:text-white text-base mb-2 truncate">
        {competition || 'Sin competición'}
      </div>
      <div className="flex gap-3 text-sm mb-2">
        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{record.W}V</span>
        <span className="text-amber-600 dark:text-amber-400 font-bold">{record.D}E</span>
        <span className="text-red-600 dark:text-red-400 font-bold">{record.L}D</span>
        <span className="text-slate-500 ml-auto">{gf}–{ga}</span>
      </div>
      <div className="text-xs text-slate-400">{finished.length} partidos jugados</div>
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function Home() {
  const navigate  = useNavigate()
  const { activeMatch, matchHistory, clearActiveMatch } = useMatchStore()
  const { players } = useRosterStore()
  const { teamName } = useSettingsStore()
  const { dark, toggle } = useTheme()
  const [selectedComp, setSelectedComp] = useState(null)

  const isLive  = activeMatch?.phase === PHASE.LIVE
  const isPre   = activeMatch?.phase === PHASE.PRE
  const isPost  = activeMatch?.phase === PHASE.POST
  const score   = activeMatch?.score ?? { home: 0, away: 0 }

  const finishedMatches = matchHistory.filter(m => m.phase === PHASE.POST)
  const wins   = finishedMatches.filter(m => getMatchResult(m.score ?? { home: 0, away: 0 }) === 'W').length
  const played = finishedMatches.length

  // Squad health
  const healthCounts = players.reduce((acc, p) => {
    const s = p.status ?? 'available'
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})
  const unavailableCount = (healthCounts.injured ?? 0) + (healthCounts.suspended ?? 0) + (healthCounts.absent ?? 0)
  const availableCount   = healthCounts.available ?? players.length

  // Group by competition
  const compMap = new Map()
  for (const m of finishedMatches) {
    const key = m.competition || ''
    if (!compMap.has(key)) compMap.set(key, [])
    compMap.get(key).push(m)
  }
  const competitions = [...compMap.keys()]
  const multiComp    = competitions.length > 1

  // Matches to show in recents section
  const displayMatches = selectedComp !== null
    ? finishedMatches.filter(m => (m.competition || '') === selectedComp)
    : finishedMatches.slice(0, 5)

  return (
    <div className="page-container bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-8 pb-4">
        <div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Football DSS</div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">{teamName}</h1>
        </div>
        <button onClick={toggle}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-lg active:scale-90 transition-all">
          {dark ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="px-4 space-y-4">

        {/* New Match CTA — always visible */}
        <button
          onClick={() => navigate('/setup')}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-4 text-left active:scale-[0.98] transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-4"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/20 text-2xl shrink-0">⚽</div>
          <div>
            <div className="text-white font-black text-lg leading-tight">Nuevo Partido</div>
            <div className="text-emerald-200 text-sm mt-0.5">
              {matchHistory.length > 0 ? 'XI anterior pre-cargado' : 'Configura tu equipo'}
            </div>
          </div>
          <div className="ml-auto text-white/60 text-2xl">›</div>
        </button>

        {/* Active match card */}
        {activeMatch && (
          <Card className={cn(
            'overflow-hidden border-2',
            isLive ? 'border-red-400 dark:border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
            : isPre ? 'border-emerald-400 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/10'
            : 'border-slate-300 dark:border-slate-600/40',
          )}>
            <CardBody>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isLive && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/30 rounded-full px-2.5 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      EN VIVO
                    </span>
                  )}
                  {isPre  && <Badge color="emerald">PRE-PARTIDO</Badge>}
                  {isPost && <Badge color="slate">TERMINADO</Badge>}
                </div>
                {isPost && (
                  <button onClick={() => clearActiveMatch()} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    Cerrar ✕
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-lg">vs {activeMatch.opponent}</div>
                  <div className="text-xs text-slate-500">{activeMatch.formation} · {formatDate(activeMatch.date)}</div>
                </div>
                {(isLive || isPost) && (
                  <div className="text-3xl font-black text-slate-900 dark:text-white">{score.home}–{score.away}</div>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="flex-1" variant={isLive ? 'danger' : 'primary'} onClick={() => navigate('/live')}>
                  {isLive ? '⚽ Seguimiento en vivo' : isPre ? '▶ Continuar configuración' : '📊 Resumen'}
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

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center py-4">
            <div className="text-2xl font-black text-slate-900 dark:text-white">{players.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">Jugadores</div>
          </Card>
          <Card className="text-center py-4">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{wins}</div>
            <div className="text-xs text-slate-500 mt-0.5">Victorias</div>
          </Card>
          <Card className="text-center py-4">
            <div className="text-2xl font-black text-slate-900 dark:text-white">{played}</div>
            <div className="text-xs text-slate-500 mt-0.5">Partidos</div>
          </Card>
        </div>

        {/* Squad Health */}
        {players.length > 0 && (
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Estado del Equipo</h3>
                {unavailableCount > 0 && (
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">{unavailableCount} no disponible{unavailableCount > 1 ? 's' : ''}</span>
                )}
              </div>

              {/* Health bar */}
              <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex mb-2.5">
                {availableCount > 0 && (
                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(availableCount / players.length) * 100}%` }} />
                )}
                {(healthCounts.injured ?? 0) > 0 && (
                  <div className="bg-red-400 h-full" style={{ width: `${((healthCounts.injured ?? 0) / players.length) * 100}%` }} />
                )}
                {(healthCounts.suspended ?? 0) > 0 && (
                  <div className="bg-orange-400 h-full" style={{ width: `${((healthCounts.suspended ?? 0) / players.length) * 100}%` }} />
                )}
                {(healthCounts.absent ?? 0) > 0 && (
                  <div className="bg-amber-400 h-full" style={{ width: `${((healthCounts.absent ?? 0) / players.length) * 100}%` }} />
                )}
              </div>

              {/* Status breakdown */}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{availableCount}</span>
                  <span className="text-xs text-slate-500">disponibles</span>
                </div>
                {(healthCounts.injured ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">🤕</span>
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">{healthCounts.injured}</span>
                    <span className="text-xs text-slate-500">lesionado{healthCounts.injured > 1 ? 's' : ''}</span>
                  </div>
                )}
                {(healthCounts.suspended ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">🟥</span>
                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">{healthCounts.suspended}</span>
                    <span className="text-xs text-slate-500">sancionado{healthCounts.suspended > 1 ? 's' : ''}</span>
                  </div>
                )}
                {(healthCounts.absent ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">⚠️</span>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{healthCounts.absent}</span>
                    <span className="text-xs text-slate-500">ausente{healthCounts.absent > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* ── Multi-competition mode ──────────────────────────────────────── */}
        {multiComp && !selectedComp && (
          <Card>
            <CardHeader><h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Competiciones</h2></CardHeader>
            <CardBody className="pt-0 grid grid-cols-1 gap-3">
              {competitions.map(comp => (
                <CompetitionCard
                  key={comp}
                  competition={comp}
                  matches={compMap.get(comp)}
                  onClick={() => setSelectedComp(comp)}
                />
              ))}
            </CardBody>
          </Card>
        )}

        {/* Back to competitions */}
        {multiComp && selectedComp !== null && (
          <button
            onClick={() => setSelectedComp(null)}
            className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-semibold"
          >
            ← Competiciones
            <span className="text-slate-500 font-normal">{selectedComp || 'Sin competición'}</span>
          </button>
        )}

        {/* Recent results */}
        {displayMatches.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {multiComp && selectedComp !== null ? 'Resultados' : 'Últimos resultados'}
              </h2>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-700/30">
                {displayMatches.map(match => {
                  const s = match.score ?? { home: 0, away: 0 }
                  const r = getMatchResult(s)
                  return (
                    <div key={match.id} className="flex items-center gap-3 py-3">
                      <span className={cn('w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black', {
                        W: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                        L: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
                        D: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                      }[r])}>
                        {r}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">vs {match.opponent}</div>
                        <div className="text-xs text-slate-500">{formatDate(match.date)}{match.competition ? ` · ${match.competition}` : ''}</div>
                      </div>
                      <div className="text-base font-black text-slate-900 dark:text-white">{s.home}–{s.away}</div>
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Form strip */}
        {finishedMatches.length > 0 && (
          <div className="flex items-center gap-2 pb-2">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest shrink-0">Forma</span>
            <div className="flex gap-1.5">
              {[...finishedMatches].reverse().slice(0, 5).map(m => {
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
