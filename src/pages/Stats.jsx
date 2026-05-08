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
import { formatDate, getMatchResult, getResultColor, cn } from '../lib/utils'
import { exportMatchCSV, exportSeasonCSV } from '../lib/exportCSV'

// ── Shared helpers ────────────────────────────────────────────────────────────

const TABS = [
  { key: 'match',   label: 'Last Match' },
  { key: 'season',  label: 'Season'     },
  { key: 'players', label: 'Players'    },
]

function TabBar({ tab, onTab }) {
  return (
    <div className="flex gap-1 mx-4 mb-4 bg-slate-800/40 rounded-xl p-1">
      {TABS.map(t => (
        <button
          key={t.key}
          onClick={() => onTab(t.key)}
          className={cn(
            'flex-1 py-2 rounded-lg text-xs font-bold transition-all',
            tab === t.key ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Match Timeline sheet (shared by Last Match and Season history) ────────────

function MatchTimelineSheet({ match, open, onClose }) {
  const { players } = useRosterStore()
  const stats = useTeamStats(open ? match : null)  // only compute when visible

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={match ? `vs ${match.opponent} — ${formatDate(match.date)}` : ''}
      tall
    >
      {stats && (
        <div className="px-4 pt-3 pb-8 space-y-4">
          {/* Score */}
          <div className="flex items-center justify-between bg-slate-800/60 rounded-2xl px-5 py-3">
            <span className="text-2xl font-black text-white">
              {stats.score.home}–{stats.score.away}
            </span>
            <span className={cn('text-sm font-black', getResultColor(getMatchResult(stats.score)))}>
              {getMatchResult(stats.score) === 'W' ? 'WIN' : getMatchResult(stats.score) === 'L' ? 'LOSS' : 'DRAW'}
            </span>
          </div>

          {/* Timeline */}
          <Timeline timeline={stats.timeline} />

          {/* Export */}
          <button
            onClick={() => exportMatchCSV(match, players)}
            className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold active:scale-[0.98] transition-all"
          >
            ↓ Export Match CSV
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

  const statRow = (label, value, accent = 'text-white') => (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-800/80 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={cn('text-sm font-bold', accent)}>{value}</span>
    </div>
  )

  const mpHours = player.minutesPlayed >= 60
    ? ` (${Math.floor(player.minutesPlayed / 60)}h ${player.minutesPlayed % 60}m)`
    : ''

  return (
    <BottomSheet open={open} onClose={onClose} title={player.name}>
      <div className="px-4 pt-4 pb-8">
        {/* Player badge */}
        <div className="flex items-center gap-4 mb-5 p-4 rounded-2xl bg-slate-800/60">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white', posColor)}>
            {player.number ?? '?'}
          </div>
          <div>
            <div className="font-black text-white text-lg">{player.name}</div>
            <Badge color={player.position}>{player.position}</Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl bg-slate-800/40 px-4">
          {statRow('Matches Played', player.played,                            'text-white')}
          {statRow('Minutes Played', `${player.minutesPlayed}' ${mpHours}`,    'text-slate-300')}
          {statRow('Goals',          player.goals   || '—',                   player.goals   > 0 ? 'text-emerald-400' : 'text-slate-600')}
          {statRow('Assists',        player.assists || '—',                   player.assists > 0 ? 'text-sky-400'     : 'text-slate-600')}
          {statRow('Shots On Target',player.shotsOn || '—',                   player.shotsOn > 0 ? 'text-slate-300'   : 'text-slate-600')}
          {statRow('Chances Created (Danger)', player.danger || '—',          player.danger  > 0 ? 'text-amber-400'   : 'text-slate-600')}
          {statRow('Yellow Cards',   player.yellow || '—',                    player.yellow  > 0 ? 'text-yellow-300'  : 'text-slate-600')}
          {statRow('Red Cards',      player.red    || '—',                    player.red     > 0 ? 'text-red-400'     : 'text-slate-600')}
        </div>

        {/* Shooting efficiency */}
        {(player.shotsOn + (player.shotsOff ?? 0)) > 0 && (
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Shot Efficiency</div>
            <StatBar
              label="Shots on Target"
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
        <h2 className="text-lg font-bold text-white mb-2">No match data yet</h2>
        <p className="text-slate-500 text-sm">Start and finish a match to see analytics.</p>
      </div>
    )
  }

  const result = getMatchResult(stats.score)

  return (
    <div className="px-4 space-y-4">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-900/30 to-slate-800/30 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 mb-0.5">{match.competition || 'Match'}</div>
              <div className="text-lg font-black text-white">vs {match.opponent}</div>
              <div className="text-xs text-slate-400">{formatDate(match.date)}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-white">{stats.score.home}–{stats.score.away}</div>
              <span className={cn('text-sm font-black', getResultColor(result))}>
                {result === 'W' ? 'WIN' : result === 'L' ? 'LOSS' : 'DRAW'}
              </span>
            </div>
          </div>
          <button
            onClick={() => exportMatchCSV(match, players)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors active:scale-[0.98]"
          >
            ↓ Export Match CSV
          </button>
        </div>
      </Card>

      {/* Inner tabs */}
      <div className="flex gap-1 bg-slate-800/40 rounded-xl p-1">
        {['overview', 'timeline', 'players'].map(t => (
          <button key={t} onClick={() => setInner(t)}
            className={cn('flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all',
              inner === t ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-white'
            )}
          >{t}</button>
        ))}
      </div>

      {inner === 'overview' && (
        <>
          <div className="grid grid-cols-4 gap-2">
            <MiniStat label="Goals"    value={stats.score.home}       color="emerald" />
            <MiniStat label="Shots"    value={stats.totalShots}       color="sky"     />
            <MiniStat label="Accuracy" value={`${stats.shotAccuracy}%`} color="amber"  />
            <MiniStat label="Danger"   value={stats.danger}           color="red"     />
          </div>
          <Card>
            <CardHeader><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shooting</h3></CardHeader>
            <CardBody className="space-y-3">
              <StatBar label="Shots on Target"    value={stats.shotsOn}       max={Math.max(stats.totalShots, 1)} color="emerald" />
              <StatBar label="Shots off Target"   value={stats.shotsOff}      max={Math.max(stats.totalShots, 1)} color="slate"   />
              <StatBar label="Shot Accuracy"      value={stats.shotAccuracy}  max={100}                          color="sky" unit="%" />
              <StatBar label="Dangerous Attacks"  value={stats.danger}        max={Math.max(stats.danger, 10)}   color="amber"   />
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Discipline</h3></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                  <span className="text-2xl">🟨</span>
                  <div><div className="text-2xl font-black text-yellow-300">{stats.yellows}</div><div className="text-xs text-slate-400">Yellows</div></div>
                </div>
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <span className="text-2xl">🟥</span>
                  <div><div className="text-2xl font-black text-red-400">{stats.reds}</div><div className="text-xs text-slate-400">Reds</div></div>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {inner === 'timeline' && (
        <Card>
          <CardHeader><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Match Events</h3></CardHeader>
          <CardBody><Timeline timeline={stats.timeline} /></CardBody>
        </Card>
      )}

      {inner === 'players' && (
        <Card>
          <CardHeader><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Player Performance</h3></CardHeader>
          <CardBody>
            {stats.rosterStats.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No player events recorded</p>
            ) : (
              <div className="space-y-2">
                {stats.rosterStats.map(ps => (
                  <div key={ps.playerId} className="flex items-center gap-3 py-2 border-b border-slate-700/30 last:border-0">
                    <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700/60 text-xs font-bold font-mono">{ps.number ?? '?'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{ps.name}</div>
                    </div>
                    <div className="flex gap-2">
                      {ps.goals   > 0 && <span className="text-emerald-400 text-xs font-bold">⚽{ps.goals}</span>}
                      {ps.assists > 0 && <span className="text-sky-400 text-xs font-bold">🎯{ps.assists}</span>}
                      {ps.shotsOn > 0 && <span className="text-slate-300 text-xs font-bold">👁{ps.shotsOn}</span>}
                      {ps.yellow  > 0 && <span className="text-yellow-300 text-xs font-bold">🟨{ps.yellow}</span>}
                      {ps.red     > 0 && <span className="text-red-400 text-xs font-bold">🟥{ps.red}</span>}
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
        <h2 className="text-lg font-bold text-white mb-2">Season not started</h2>
        <p className="text-slate-500 text-sm">Finish at least one match to see season stats.</p>
      </div>
    )
  }

  const RESULT_STYLE = {
    W: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    D: 'bg-amber-500/20  text-amber-400  border-amber-500/30',
    L: 'bg-red-500/20    text-red-400    border-red-500/30',
  }

  return (
    <div className="px-4 space-y-4">
      {/* Export */}
      <button
        onClick={() => exportSeasonCSV(matchHistory, players)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/20 transition-colors active:scale-[0.98]"
      >
        ↓ Export Season CSV
      </button>

      {/* Season record */}
      <Card>
        <CardHeader><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Season Record</h3></CardHeader>
        <CardBody>
          <div className="grid grid-cols-4 gap-2 text-center mb-3">
            <MiniStat label="Played" value={s.record.played} color="slate"   />
            <MiniStat label="Wins"   value={s.record.W}      color="emerald" />
            <MiniStat label="Draws"  value={s.record.D}      color="amber"   />
            <MiniStat label="Losses" value={s.record.L}      color="red"     />
          </div>
          {/* Form strip */}
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
          <div className="text-[10px] text-slate-600 mt-1">Form (oldest → latest)</div>
        </CardBody>
      </Card>

      {/* Goals */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center py-4">
          <div className="text-3xl font-black text-emerald-400">{s.goalsFor}</div>
          <div className="text-xs text-slate-500 mt-0.5">Goals Scored</div>
          <div className="text-xs text-slate-600">avg {s.avgGoalsFor}/game</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-3xl font-black text-red-400">{s.goalsAgainst}</div>
          <div className="text-xs text-slate-500 mt-0.5">Conceded</div>
          <div className="text-xs text-slate-600">avg {s.avgGoalsAgainst}/game</div>
        </Card>
      </div>

      {/* Attack metrics */}
      <Card>
        <CardHeader><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attack Metrics</h3></CardHeader>
        <CardBody className="space-y-3">
          <StatBar label="Shots on Target"          value={s.totalShotsOn} max={Math.max(s.totalShots, 1)} color="emerald" />
          <StatBar label="Shot Accuracy"            value={s.shotAccuracy} max={100}                       color="sky" unit="%" />
          <StatBar label="Dangerous Attacks (total)" value={s.totalDanger} max={Math.max(s.totalDanger, 20)} color="amber" />
          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div><div className="font-black text-white text-lg">{s.avgShotsOn}</div><div className="text-slate-500">avg SOT/game</div></div>
            <div><div className="font-black text-white text-lg">{s.avgDanger}</div><div className="text-slate-500">avg danger/game</div></div>
            <div><div className="font-black text-white text-lg">{s.totalShots}</div><div className="text-slate-500">total shots</div></div>
          </div>
        </CardBody>
      </Card>

      {/* Discipline */}
      <Card>
        <CardHeader><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Discipline</h3></CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <span className="text-2xl">🟨</span>
              <div><div className="text-2xl font-black text-yellow-300">{s.totalYellows}</div><div className="text-xs text-slate-400">Yellows</div></div>
            </div>
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <span className="text-2xl">🟥</span>
              <div><div className="text-2xl font-black text-red-400">{s.totalReds}</div><div className="text-xs text-slate-400">Reds</div></div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Match History list ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Match History</h3>
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
                  'hover:bg-slate-700/40 active:scale-[0.98] transition-all text-left'
                )}
              >
                {/* Result badge */}
                <span className={cn('w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black border shrink-0', RESULT_STYLE[result])}>
                  {result}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm truncate">vs {m.opponent}</div>
                  <div className="text-xs text-slate-500">
                    {formatDate(m.date)}{m.competition ? ` · ${m.competition}` : ''}
                  </div>
                </div>

                <span className="text-lg font-black text-white shrink-0">{score.home}–{score.away}</span>
                <span className="text-slate-600 text-sm shrink-0">›</span>
              </button>
            )
          })}
        </CardBody>
      </Card>

      {/* Match detail sheet */}
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
        <h2 className="text-lg font-bold text-white mb-2">No player data yet</h2>
        <p className="text-slate-500 text-sm">Log events during matches to track player stats.</p>
      </div>
    )
  }

  return (
    <div className="px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Season — All Players</h3>
            <span className="text-xs text-slate-600">{s.record.played} matches</span>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          {/* Column headers */}
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest pb-2 border-b border-slate-700/40">
            <div className="w-7" />
            <div className="flex-1">Player</div>
            <div className="w-5 text-center" title="Goals">⚽</div>
            <div className="w-5 text-center" title="Assists">🎯</div>
            <div className="w-6 text-center" title="Min">Min</div>
            <div className="w-5 text-center" title="Yellow">🟨</div>
            <div className="w-6 text-center">Apps</div>
          </div>

          <div className="divide-y divide-slate-700/20">
            {s.playerStats.map(ps => (
              <button
                key={ps.playerId}
                onClick={() => setSelectedPlayer(ps)}
                className="w-full flex items-center gap-1 py-3 hover:bg-slate-800/40 active:scale-[0.98] transition-all rounded-xl text-left"
              >
                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700/60 text-xs font-bold font-mono text-slate-300 shrink-0">
                  {ps.number ?? '?'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{ps.name}</div>
                  <Badge color={ps.position} className="mt-0.5">{ps.position}</Badge>
                </div>
                <div className={cn('w-5 text-center text-sm font-black', ps.goals   > 0 ? 'text-emerald-400' : 'text-slate-700')}>{ps.goals   || '—'}</div>
                <div className={cn('w-5 text-center text-sm font-bold', ps.assists > 0 ? 'text-sky-400'     : 'text-slate-700')}>{ps.assists || '—'}</div>
                <div className={cn('w-6 text-center text-xs font-bold', ps.minutesPlayed > 0 ? 'text-slate-400' : 'text-slate-700')}>{ps.minutesPlayed || '—'}</div>
                <div className={cn('w-5 text-center text-sm font-bold', ps.yellow   > 0 ? 'text-yellow-300' : 'text-slate-700')}>{ps.yellow   || '—'}</div>
                <div className="w-6 text-center text-xs text-slate-500">{ps.played}</div>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Player deep-dive sheet */}
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
    <div className="page-container">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-black text-white">Analytics</h1>
        <p className="text-sm text-slate-400 mt-0.5">Match performance & season overview</p>
      </div>

      <TabBar tab={tab} onTab={setTab} />

      {tab === 'match'   && <MatchTab match={viewMatch} />}
      {tab === 'season'  && <SeasonTab />}
      {tab === 'players' && <PlayersTab />}
    </div>
  )
}
