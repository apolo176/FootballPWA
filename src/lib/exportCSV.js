import { EVENT } from './constants'
import { formatMinute, getMatchResult } from './utils'

// ── Core CSV serialiser ───────────────────────────────────────────────────────

function cell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function row(cells) {
  return cells.map(cell).join(',')
}

function download(csvString, filename) {
  // BOM prefix (﻿) makes Excel / Numbers auto-detect UTF-8
  const blob = new Blob(['﻿' + csvString], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function playerName(players, id) {
  return players.find(p => p.id === id)?.name ?? ''
}

function buildPerPlayerStats(events, players) {
  const ZERO = () => ({ goals: 0, assists: 0, shotsOn: 0, shotsOff: 0, yellow: 0, red: 0, danger: 0 })
  const map = {}
  const ensure = (id) => { if (!map[id]) map[id] = ZERO() }

  for (const e of events) {
    if (e.playerId) {
      ensure(e.playerId)
      if (e.type === EVENT.GOAL)     map[e.playerId].goals++
      if (e.type === EVENT.SHOT_ON)  map[e.playerId].shotsOn++
      if (e.type === EVENT.SHOT_OFF) map[e.playerId].shotsOff++
      if (e.type === EVENT.YELLOW)   map[e.playerId].yellow++
      if (e.type === EVENT.RED)      map[e.playerId].red++
      if (e.type === EVENT.DANGER)   map[e.playerId].danger++
    }
    if (e.type === EVENT.GOAL && e.assistPlayerId) {
      ensure(e.assistPlayerId)
      map[e.assistPlayerId].assists++
    }
  }

  return Object.entries(map)
    .map(([id, s]) => {
      const p = players.find(pl => pl.id === id)
      return { ...s, id, name: p?.name ?? 'Unknown', number: p?.number ?? '', position: p?.position ?? '' }
    })
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
}

// ── Single-match export ───────────────────────────────────────────────────────

export function exportMatchCSV(match, players) {
  const lines = []
  const score = match.score ?? { home: 0, away: 0 }

  // ── Header ──
  lines.push(row(['Football DSS – Match Report']))
  lines.push(row([`vs ${match.opponent}`, match.date, `${score.home}–${score.away}`, match.competition ?? '']))
  lines.push('')

  // ── Event log ──
  lines.push(row(['MATCH EVENTS']))
  lines.push(row(['Minute', 'Type', 'Player', 'Detail (Assist / Reason)']))

  const sorted = [...(match.events ?? [])].sort((a, b) => a.elapsedSeconds - b.elapsedSeconds)
  const SKIP   = new Set(['match_start', 'match_end', 'half_time', 'second_half'])

  for (const e of sorted) {
    if (SKIP.has(e.type)) continue
    const minute  = formatMinute(e.elapsedSeconds)
    const mainP   = playerName(players, e.playerId)
    let   detail  = ''
    if (e.assistPlayerId) detail = `Assist: ${playerName(players, e.assistPlayerId)}`
    else if (e.reason)    detail = e.reason
    else if (e.subPlayerId) detail = `→ ${playerName(players, e.subPlayerId)}`

    lines.push(row([minute, e.type, mainP, detail]))
  }

  lines.push('')

  // ── Player stats ──
  lines.push(row(['PLAYER STATS']))
  lines.push(row(['#', 'Player', 'Position', 'Goals', 'Assists', 'Shots On', 'Shots Off', 'Yellow', 'Red', 'Danger']))

  const stats = buildPerPlayerStats(sorted, players)
  for (const s of stats) {
    lines.push(row([s.number, s.name, s.position, s.goals, s.assists, s.shotsOn, s.shotsOff, s.yellow, s.red, s.danger]))
  }

  const filename = `match_${match.opponent.replace(/\s+/g, '_')}_${match.date}.csv`
  download(lines.join('\n'), filename)
}

// ── Full-season export ────────────────────────────────────────────────────────

export function exportSeasonCSV(matchHistory, players) {
  const finished = matchHistory.filter(m => m.phase === 'post')
  const lines    = []

  // ── Header ──
  lines.push(row(['Football DSS – Season Report']))
  lines.push(row([`Exported: ${new Date().toLocaleDateString('en-GB')}`, `${finished.length} matches`]))
  lines.push('')

  // ── Match results ──
  lines.push(row(['MATCH RESULTS']))
  lines.push(row(['Date', 'Opponent', 'Competition', 'Score', 'Result']))

  for (const m of finished) {
    const score  = m.score ?? { home: 0, away: 0 }
    const result = getMatchResult(score)
    lines.push(row([m.date, m.opponent, m.competition ?? '', `${score.home}–${score.away}`, result]))
  }

  lines.push('')

  // ── Season player stats ──
  lines.push(row(['SEASON PLAYER STATS']))
  lines.push(row(['#', 'Player', 'Position', 'Matches', 'Goals', 'Assists', 'Shots On', 'Yellow', 'Red', 'Danger']))

  // Aggregate across all finished matches
  const ZERO  = () => ({ goals: 0, assists: 0, shotsOn: 0, shotsOff: 0, yellow: 0, red: 0, danger: 0, matchIds: new Set() })
  const agg   = {}
  const touch = (id, matchId) => {
    if (!agg[id]) agg[id] = ZERO()
    agg[id].matchIds.add(matchId)
  }

  for (const match of finished) {
    for (const e of match.events ?? []) {
      if (e.playerId) {
        touch(e.playerId, match.id)
        if (e.type === EVENT.GOAL)     agg[e.playerId].goals++
        if (e.type === EVENT.SHOT_ON)  agg[e.playerId].shotsOn++
        if (e.type === EVENT.SHOT_OFF) agg[e.playerId].shotsOff++
        if (e.type === EVENT.YELLOW)   agg[e.playerId].yellow++
        if (e.type === EVENT.RED)      agg[e.playerId].red++
        if (e.type === EVENT.DANGER)   agg[e.playerId].danger++
      }
      if (e.type === EVENT.GOAL && e.assistPlayerId) {
        touch(e.assistPlayerId, match.id)
        agg[e.assistPlayerId].assists++
      }
    }
  }

  const seasonStats = Object.entries(agg)
    .map(([id, s]) => {
      const p = players.find(pl => pl.id === id)
      return { ...s, id, name: p?.name ?? 'Unknown', number: p?.number ?? '', position: p?.position ?? '' }
    })
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)

  for (const s of seasonStats) {
    lines.push(row([s.number, s.name, s.position, s.matchIds.size, s.goals, s.assists, s.shotsOn, s.yellow, s.red, s.danger]))
  }

  download(lines.join('\n'), `season_report_${new Date().toISOString().slice(0, 10)}.csv`)
}
