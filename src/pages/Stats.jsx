import { useState } from 'react'
import { useMatchStore } from '../store/matchStore'
import { useRosterStore } from '../store/rosterStore'
import { useTeamStats } from '../hooks/useTeamStats'
import { useSeasonStats } from '../hooks/useSeasonStats'
import { Timeline } from '../components/stats/Timeline'
import { StatBar, MiniStat } from '../components/stats/StatBar'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { BottomSheet } from '../components/match/sheets/BottomSheet'
import { HBarChart, Leaderboard } from '../components/stats/AnalyticsChart'
import { formatDate, getMatchResult, getResultColor, cn } from '../lib/utils'
import { exportMatchCSV, exportSeasonCSV } from '../lib/exportCSV'
import { EVENT, GOAL_TYPES, YELLOW_REASONS, RED_REASONS } from '../lib/constants'

// ── Shared helpers ────────────────────────────────────────────────────────────

const TABS = [
  { key: 'match',   label: 'Partido'   },
  { key: 'season',  label: 'Temporada' },
  { key: 'players', label: 'Jugadores' },
]

function TabBar({ tab, onTab }) {
  return (
    <div className="flex gap-1 mx-4 mb-4 bg-slate-100 dark:bg-slate-800/40 rounded-xl p-1">
      {TABS.map(t => (
        <button
          key={t.key}
          onClick={() => onTab(t.key)}
          className={cn(
            'flex-1 py-2 rounded-lg text-xs font-bold transition-all',
            tab === t.key ? 'bg-emerald-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Match Timeline sheet ──────────────────────────────────────────────────────

function MatchTimelineSheet({ match, open, onClose }) {
  const { players } = useRosterStore()
  const stats = useTeamStats(open ? match : null)

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={match ? `vs ${match.opponent} — ${formatDate(match.date)}` : ''}
      tall
    >
      {stats && (
        <div className="px-4 pt-3 pb-8 space-y-4">
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/60 rounded-2xl px-5 py-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.score.home}–{stats.score.away}
            </span>
            <span className={cn('text-sm font-black', getResultColor(getMatchResult(stats.score)))}>
              {getMatchResult(stats.score) === 'W' ? 'Victoria' : getMatchResult(stats.score) === 'L' ? 'Derrota' : 'Empate'}
            </span>
          </div>

          <Timeline timeline={stats.timeline} />

          <button
            onClick={() => exportMatchCSV(match, players)}
            className="w-full py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-sm font-semibold active:scale-[0.98] transition-all"
          >
            ↓ Exportar CSV del Partido
          </button>
        </div>
      )}
    </BottomSheet>
  )
}

// ── Player deep-dive sheet ────────────────────────────────────────────────────

function PlayerDetailSheet({ player, open, onClose }) {
  if (!player) return null
  const posColor = { GK: 'bg-amber-500', DEF: 'bg-sky-500', MID: 'bg-emerald-500', FWD: 'bg-red-500' }[player.position] ?? 'bg-slate-500'

  const statRow = (label, value, accent = 'text-slate-900 dark:text-white') => (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className={cn('text-sm font-bold', accent)}>{value}</span>
    </div>
  )

  const mpHours = player.minutesPlayed >= 60
    ? ` (${Math.floor(player.minutesPlayed / 60)}h ${player.minutesPlayed % 60}m)`
    : ''

  return (
    <BottomSheet open={open} onClose={onClose} title={player.name}>
      <div className="px-4 pt-4 pb-8">
        <div className="flex items-center gap-4 mb-5 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white', posColor)}>
            {player.number ?? '?'}
          </div>
          <div>
            <div className="font-black text-slate-900 dark:text-white text-lg">{player.name}</div>
            <Badge color={player.position}>{player.position}</Badge>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 px-4">
          {statRow('Partidos',         player.played)}
          {statRow('Minutos',          `${player.minutesPlayed}' ${mpHours}`, 'text-slate-600 dark:text-slate-300')}
          {statRow('Goles',            player.goals   || '—', player.goals   > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')}
          {statRow('Asistencias',      player.assists || '—', player.assists > 0 ? 'text-sky-600 dark:text-sky-400'         : 'text-slate-400')}
          {statRow('Tiros a puerta',   player.shotsOn || '—', player.shotsOn > 0 ? 'text-slate-600 dark:text-slate-300'     : 'text-slate-400')}
          {statRow('Ocasiones (Peligro)', player.danger || '—', player.danger > 0 ? 'text-amber-600 dark:text-amber-400'   : 'text-slate-400')}
          {statRow('Tarjetas Amarillas', player.yellow || '—', player.yellow > 0 ? 'text-yellow-600 dark:text-yellow-300'  : 'text-slate-400')}
          {statRow('Tarjetas Rojas',   player.red    || '—', player.red     > 0 ? 'text-red-600 dark:text-red-400'         : 'text-slate-400')}
        </div>

        {(player.shotsOn + (player.shotsOff ?? 0)) > 0 && (
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Eficiencia de Tiro</div>
            <StatBar
              label="Tiros a puerta"
              value={player.shotsOn}
              max={player.shotsOn + (player.shotsOff ?? 0)}
              color="emerald"
            />
          </div>
        )}
      </div>
    </BottomSheet>
  )
}

// ── Last Match tab ─────────────────────────────────────────────────────────────

function MatchTab({ match }) {
  const { players } = useRosterStore()
  const stats = useTeamStats(match)
  const [inner, setInner] = useState('overview')

  if (!match || !stats) {
    return (
      <div className="text-center py-16 px-8">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sin datos de partido</h2>
        <p className="text-slate-500 text-sm">Completa un partido para ver el análisis.</p>
      </div>
    )
  }

  const result = getMatchResult(stats.score)

  return (
    <div className="px-4 space-y-4">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 dark:from-emerald-900/30 to-slate-100 dark:to-slate-800/30 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 mb-0.5">{match.competition || 'Partido'}</div>
              <div className="text-lg font-black text-slate-900 dark:text-white">vs {match.opponent}</div>
              <div className="text-xs text-slate-500">{formatDate(match.date)}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-slate-900 dark:text-white">{stats.score.home}–{stats.score.away}</div>
              <span className={cn('text-sm font-black', getResultColor(result))}>
                {result === 'W' ? 'Victoria' : result === 'L' ? 'Derrota' : 'Empate'}
              </span>
            </div>
          </div>
          <button
            onClick={() => exportMatchCSV(match, players)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors active:scale-[0.98]"
          >
            ↓ Exportar CSV
          </button>
        </div>
      </Card>

      {/* Inner tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/40 rounded-xl p-1">
        {[['overview','Resumen'],['timeline','Eventos'],['players','Jugadores']].map(([k,l]) => (
          <button key={k} onClick={() => setInner(k)}
            className={cn('flex-1 py-1.5 rounded-lg text-xs font-bold transition-all',
              inner === k ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'
            )}
          >{l}</button>
        ))}
      </div>

      {inner === 'overview' && (
        <>
          <div className="grid grid-cols-4 gap-2">
            <MiniStat label="Goles"    value={stats.score.home}       color="emerald" />
            <MiniStat label="Tiros"    value={stats.totalShots}       color="sky"     />
            <MiniStat label="Precisión" value={`${stats.shotAccuracy}%`} color="amber" />
            <MiniStat label="Peligro"  value={stats.danger}           color="red"     />
          </div>
          <Card>
            <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tiro</h3></CardHeader>
            <CardBody className="space-y-3">
              <StatBar label="Tiros a puerta"    value={stats.shotsOn}       max={Math.max(stats.totalShots, 1)} color="emerald" />
              <StatBar label="Tiros fuera"       value={stats.shotsOff}      max={Math.max(stats.totalShots, 1)} color="slate"   />
              <StatBar label="Precisión de tiro" value={stats.shotAccuracy}  max={100}                          color="sky" unit="%" />
              <StatBar label="Ataques peligrosos" value={stats.danger}       max={Math.max(stats.danger, 10)}   color="amber"   />
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Disciplina</h3></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-3">
                  <span className="text-2xl">🟨</span>
                  <div><div className="text-2xl font-black text-yellow-600 dark:text-yellow-300">{stats.yellows}</div><div className="text-xs text-slate-500">Amarillas</div></div>
                </div>
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3">
                  <span className="text-2xl">🟥</span>
                  <div><div className="text-2xl font-black text-red-600 dark:text-red-400">{stats.reds}</div><div className="text-xs text-slate-500">Rojas</div></div>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {inner === 'timeline' && (
        <Card>
          <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Eventos del Partido</h3></CardHeader>
          <CardBody><Timeline timeline={stats.timeline} /></CardBody>
        </Card>
      )}

      {inner === 'players' && (
        <Card>
          <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rendimiento</h3></CardHeader>
          <CardBody>
            {stats.rosterStats.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Sin eventos de jugadores</p>
            ) : (
              <div className="space-y-2">
                {stats.rosterStats.map(ps => (
                  <div key={ps.playerId} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700/30 last:border-0">
                    <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60 text-xs font-bold font-mono text-slate-600 dark:text-white">
                      {ps.number ?? '?'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{ps.name}</div>
                    </div>
                    <div className="flex gap-2">
                      {ps.goals   > 0 && <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">⚽{ps.goals}</span>}
                      {ps.assists > 0 && <span className="text-sky-600 dark:text-sky-400 text-xs font-bold">🎯{ps.assists}</span>}
                      {ps.shotsOn > 0 && <span className="text-slate-500 text-xs font-bold">👁{ps.shotsOn}</span>}
                      {ps.yellow  > 0 && <span className="text-yellow-600 dark:text-yellow-300 text-xs font-bold">🟨{ps.yellow}</span>}
                      {ps.red     > 0 && <span className="text-red-600 dark:text-red-400 text-xs font-bold">🟥{ps.red}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  )
}

// ── Visual Analytics ──────────────────────────────────────────────────────────

function VisualAnalytics({ finishedMatches, playerStats }) {
  if (!finishedMatches?.length) return null

  const goalTypeData = GOAL_TYPES.map(gt => ({
    label: gt.label,
    emoji: gt.emoji,
    value: finishedMatches.reduce((acc, m) =>
      acc + (m.events ?? []).filter(e =>
        (e.type === EVENT.GOAL || e.type === EVENT.GOAL_AGAINST) && e.goalType === gt.value
      ).length, 0),
    color: 'emerald',
  }))

  const yellowData = YELLOW_REASONS.map(r => ({
    label: r, emoji: '🟨',
    value: finishedMatches.reduce((acc, m) =>
      acc + (m.events ?? []).filter(e => e.type === EVENT.YELLOW && e.reason === r).length, 0),
    color: 'yellow',
  }))

  const redData = RED_REASONS.map(r => ({
    label: r, emoji: '🟥',
    value: finishedMatches.reduce((acc, m) =>
      acc + (m.events ?? []).filter(e => e.type === EVENT.RED && e.reason === r).length, 0),
    color: 'red',
  }))

  const scorers = (playerStats ?? [])
    .filter(p => p.goals > 0)
    .map(p => ({ name: p.name, number: p.number, value: p.goals, sub: `${p.assists} asist.` }))

  const assisters = (playerStats ?? [])
    .filter(p => p.assists > 0)
    .sort((a, b) => b.assists - a.assists)
    .map(p => ({ name: p.name, number: p.number, value: p.assists, sub: `${p.goals} gol${p.goals !== 1 ? 'es' : ''}` }))

  return (
    <>
      {scorers.length > 0 && (
        <Card>
          <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">⚽ Máximos Goleadores</h3></CardHeader>
          <CardBody><Leaderboard data={scorers} color="emerald" /></CardBody>
        </Card>
      )}

      {assisters.length > 0 && (
        <Card>
          <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">🎯 Máximos Asistentes</h3></CardHeader>
          <CardBody><Leaderboard data={assisters} color="sky" /></CardBody>
        </Card>
      )}

      {goalTypeData.some(d => d.value > 0) && (
        <Card>
          <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Goles por Tipo</h3></CardHeader>
          <CardBody><HBarChart data={goalTypeData} color="emerald" /></CardBody>
        </Card>
      )}

      {yellowData.some(d => d.value > 0) && (
        <Card>
          <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">🟨 Amarillas por Motivo</h3></CardHeader>
          <CardBody><HBarChart data={yellowData} color="yellow" /></CardBody>
        </Card>
      )}

      {redData.some(d => d.value > 0) && (
        <Card>
          <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">🟥 Rojas por Motivo</h3></CardHeader>
          <CardBody><HBarChart data={redData} color="red" /></CardBody>
        </Card>
      )}
    </>
  )
}

// ── Season tab ────────────────────────────────────────────────────────────────

function SeasonTab() {
  const s = useSeasonStats()
  const { matchHistory } = useMatchStore()
  const { players }      = useRosterStore()
  const [detailMatch, setDetailMatch] = useState(null)

  if (s.record.played === 0) {
    return (
      <div className="text-center py-16 px-8">
        <div className="text-5xl mb-4">🏆</div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sin partidos finalizados</h2>
        <p className="text-slate-500 text-sm">Termina al menos un partido para ver las estadísticas.</p>
      </div>
    )
  }

  const RESULT_STYLE = {
    W: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
    D: 'bg-amber-100  dark:bg-amber-500/20  text-amber-700  dark:text-amber-400  border-amber-300  dark:border-amber-500/30',
    L: 'bg-red-100    dark:bg-red-500/20    text-red-700    dark:text-red-400    border-red-300    dark:border-red-500/30',
  }

  return (
    <div className="px-4 space-y-4">
      <button
        onClick={() => exportSeasonCSV(matchHistory, players)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors active:scale-[0.98]"
      >
        ↓ Exportar Temporada CSV
      </button>

      <Card>
        <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resultados</h3></CardHeader>
        <CardBody>
          <div className="grid grid-cols-4 gap-2 text-center mb-3">
            <MiniStat label="Jugados" value={s.record.played} color="slate"   />
            <MiniStat label="V"       value={s.record.W}      color="emerald" />
            <MiniStat label="E"       value={s.record.D}      color="amber"   />
            <MiniStat label="D"       value={s.record.L}      color="red"     />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {s.finishedMatches.slice().reverse().map(m => {
              const r = getMatchResult(m.score ?? { home: 0, away: 0 })
              return (
                <span key={m.id} className={cn('w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black border', RESULT_STYLE[r])}>
                  {r}
                </span>
              )
            })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Forma (más antiguo → reciente)</div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center py-4">
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{s.goalsFor}</div>
          <div className="text-xs text-slate-500 mt-0.5">Goles marcados</div>
          <div className="text-xs text-slate-400">media {s.avgGoalsFor}/partido</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-3xl font-black text-red-600 dark:text-red-400">{s.goalsAgainst}</div>
          <div className="text-xs text-slate-500 mt-0.5">Goles encajados</div>
          <div className="text-xs text-slate-400">media {s.avgGoalsAgainst}/partido</div>
        </Card>
      </div>

      <Card>
        <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ataque</h3></CardHeader>
        <CardBody className="space-y-3">
          <StatBar label="Tiros a puerta"     value={s.totalShotsOn} max={Math.max(s.totalShots, 1)} color="emerald" />
          <StatBar label="Precisión de tiro"  value={s.shotAccuracy} max={100}                       color="sky" unit="%" />
          <StatBar label="Ataques peligrosos" value={s.totalDanger}  max={Math.max(s.totalDanger, 20)} color="amber" />
          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div><div className="font-black text-slate-900 dark:text-white text-lg">{s.avgShotsOn}</div><div className="text-slate-500">tiros/partido</div></div>
            <div><div className="font-black text-slate-900 dark:text-white text-lg">{s.avgDanger}</div><div className="text-slate-500">peligro/partido</div></div>
            <div><div className="font-black text-slate-900 dark:text-white text-lg">{s.totalShots}</div><div className="text-slate-500">tiros totales</div></div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Disciplina</h3></CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-3">
              <span className="text-2xl">🟨</span>
              <div><div className="text-2xl font-black text-yellow-600 dark:text-yellow-300">{s.totalYellows}</div><div className="text-xs text-slate-500">Amarillas</div></div>
            </div>
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3">
              <span className="text-2xl">🟥</span>
              <div><div className="text-2xl font-black text-red-600 dark:text-red-400">{s.totalReds}</div><div className="text-xs text-slate-500">Rojas</div></div>
            </div>
          </div>
        </CardBody>
      </Card>

      <VisualAnalytics finishedMatches={s.finishedMatches} playerStats={s.playerStats} />

      <Card>
        <CardHeader>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Historial</h3>
        </CardHeader>
        <CardBody className="pt-0 space-y-1">
          {s.finishedMatches.map(m => {
            const score  = m.score ?? { home: 0, away: 0 }
            const result = getMatchResult(score)
            return (
              <button
                key={m.id}
                onClick={() => setDetailMatch(m)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
                  'hover:bg-slate-100 dark:hover:bg-slate-700/40 active:scale-[0.98] transition-all text-left',
                )}
              >
                <span className={cn('w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black border shrink-0', RESULT_STYLE[result])}>
                  {result}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">vs {m.opponent}</div>
                  <div className="text-xs text-slate-500">
                    {formatDate(m.date)}{m.competition ? ` · ${m.competition}` : ''}
                  </div>
                </div>
                <span className="text-lg font-black text-slate-900 dark:text-white shrink-0">{score.home}–{score.away}</span>
                <span className="text-slate-400 text-sm shrink-0">›</span>
              </button>
            )
          })}
        </CardBody>
      </Card>

      <MatchTimelineSheet
        match={detailMatch}
        open={!!detailMatch}
        onClose={() => setDetailMatch(null)}
      />
    </div>
  )
}

// ── Players tab ───────────────────────────────────────────────────────────────

function PlayersTab() {
  const s = useSeasonStats()
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  if (s.record.played === 0) {
    return (
      <div className="text-center py-16 px-8">
        <div className="text-5xl mb-4">👤</div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sin datos de jugadores</h2>
        <p className="text-slate-500 text-sm">Registra eventos en los partidos para ver estadísticas.</p>
      </div>
    )
  }

  return (
    <div className="px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Temporada — Todos</h3>
            <span className="text-xs text-slate-400">{s.record.played} partidos</span>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-700/40">
            <div className="w-7" />
            <div className="flex-1">Jugador</div>
            <div className="w-5 text-center" title="Goles">⚽</div>
            <div className="w-5 text-center" title="Asistencias">🎯</div>
            <div className="w-6 text-center" title="Minutos">Min</div>
            <div className="w-5 text-center" title="Amarillas">🟨</div>
            <div className="w-6 text-center">PJ</div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/20">
            {s.playerStats.map(ps => (
              <button
                key={ps.playerId}
                onClick={() => setSelectedPlayer(ps)}
                className="w-full flex items-center gap-1 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 active:scale-[0.98] transition-all rounded-xl text-left"
              >
                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60 text-xs font-bold font-mono text-slate-600 dark:text-slate-300 shrink-0">
                  {ps.number ?? '?'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{ps.name}</div>
                  <Badge color={ps.position} className="mt-0.5">{ps.position}</Badge>
                </div>
                <div className={cn('w-5 text-center text-sm font-black', ps.goals   > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-700')}>{ps.goals   || '—'}</div>
                <div className={cn('w-5 text-center text-sm font-bold', ps.assists > 0 ? 'text-sky-600 dark:text-sky-400'         : 'text-slate-300 dark:text-slate-700')}>{ps.assists || '—'}</div>
                <div className={cn('w-6 text-center text-xs font-bold', ps.minutesPlayed > 0 ? 'text-slate-500' : 'text-slate-300 dark:text-slate-700')}>{ps.minutesPlayed || '—'}</div>
                <div className={cn('w-5 text-center text-sm font-bold', ps.yellow   > 0 ? 'text-yellow-600 dark:text-yellow-300' : 'text-slate-300 dark:text-slate-700')}>{ps.yellow   || '—'}</div>
                <div className="w-6 text-center text-xs text-slate-400">{ps.played}</div>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <PlayerDetailSheet
        player={selectedPlayer}
        open={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </div>
  )
}

// ── Page root ─────────────────────────────────────────────────────────────────

export default function Stats() {
  const [tab, setTab] = useState('match')
  const { activeMatch, matchHistory } = useMatchStore()

  const viewMatch = activeMatch?.phase === 'post'
    ? activeMatch
    : matchHistory[0] ?? activeMatch

  return (
    <div className="page-container bg-slate-50 dark:bg-slate-950">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Análisis</h1>
        <p className="text-sm text-slate-500 mt-0.5">Rendimiento del partido y temporada</p>
      </div>

      <TabBar tab={tab} onTab={setTab} />

      {tab === 'match'   && <MatchTab match={viewMatch} />}
      {tab === 'season'  && <SeasonTab />}
      {tab === 'players' && <PlayersTab />}
    </div>
  )
}
