import { useMemo } from 'react'
import { useMatchStore } from '../store/matchStore'
import { useRosterStore } from '../store/rosterStore'
import { EVENT, PHASE, GOAL_TYPES, YELLOW_REASONS, RED_REASONS } from '../lib/constants'
import { getMatchResult, computeScore } from '../lib/utils'
import { calcMinutesPlayed } from '../lib/minutesPlayed'

/**
 * Aggregates season-wide stats from matchHistory.
 *
 * Defensive guarantees:
 *   - Deduplicates by match ID (immune to double-push bugs).
 *   - All scores recomputed from events so the OWN_GOAL fix applies retroactively.
 *   - Pure computation — no mutations, React Native portable.
 */
export function useSeasonStats() {
  const { matchHistory } = useMatchStore()
  const { players }      = useRosterStore()

  return useMemo(() => {
    // ── Deduplicate ──────────────────────────────────────────────────────────
    const byId = new Map()
    for (const m of matchHistory) {
      if (m.phase === PHASE.POST) byId.set(m.id, m)
    }
    const finished = [...byId.values()]

    // ── Team totals ──────────────────────────────────────────────────────────
    const record = { W: 0, D: 0, L: 0, played: finished.length }
    let goalsFor = 0, goalsAgainst = 0
    let totalShotsOn = 0, totalShotsOff = 0
    let totalGoals = 0, totalOwnGoals = 0, totalDanger = 0
    let totalYellows = 0, totalReds = 0
    let totalSaves = 0, totalBigSaves = 0

    // Goal origin counters (keyed by goalType value)
    const goalOriginCount = {}
    for (const gt of GOAL_TYPES) goalOriginCount[gt.value] = 0

    // ── Per-player accumulators ──────────────────────────────────────────────
    const raw = {}

    const ensurePlayer = (id) => {
      if (!raw[id]) {
        raw[id] = {
          goals: 0, ownGoals: 0, assists: 0,
          shotsOn: 0, shotsOff: 0,
          yellow: 0, red: 0, danger: 0,
          saves: 0, bigSaves: 0,
          yellowReasons: {},   // { reason: count }
          redReasons:    {},
          minutesPlayed: 0,
          matchIds: new Set(),
        }
      }
    }

    for (const match of finished) {
      // Recompute score from events so OWN_GOAL fix applies to history too
      const score  = computeScore(match.events ?? [])
      const result = getMatchResult(score)
      record[result]++
      goalsFor     += score.home
      goalsAgainst += score.away

      // ── Minutes played ─────────────────────────────────────────────────────
      const participants = new Set([
        ...(match.lineup ?? []),
        ...(match.events ?? []).flatMap(e =>
          [e.playerId, e.subPlayerId, e.assistPlayerId].filter(Boolean)
        ),
      ])
      for (const pid of participants) {
        const mins = calcMinutesPlayed(match, pid)
        if (mins > 0) {
          ensurePlayer(pid)
          raw[pid].minutesPlayed += mins
          raw[pid].matchIds.add(match.id)
        }
      }

      // ── Event accumulators ──────────────────────────────────────────────────
      for (const e of match.events ?? []) {
        if (e.type === EVENT.SHOT_ON)  totalShotsOn++
        if (e.type === EVENT.SHOT_OFF) totalShotsOff++
        if (e.type === EVENT.GOAL)     { totalGoals++;    if (e.goalType) goalOriginCount[e.goalType] = (goalOriginCount[e.goalType] ?? 0) + 1 }
        if (e.type === EVENT.OWN_GOAL) totalOwnGoals++
        if (e.type === EVENT.DANGER)   totalDanger++
        if (e.type === EVENT.YELLOW)   totalYellows++
        if (e.type === EVENT.RED)      totalReds++
        if (e.type === EVENT.SAVE)     totalSaves++
        if (e.type === EVENT.BIG_SAVE) totalBigSaves++

        if (e.playerId) {
          ensurePlayer(e.playerId)
          raw[e.playerId].matchIds.add(match.id)
          const ps = raw[e.playerId]
          if (e.type === EVENT.GOAL)     ps.goals++
          if (e.type === EVENT.OWN_GOAL) ps.ownGoals++
          if (e.type === EVENT.SHOT_ON)  ps.shotsOn++
          if (e.type === EVENT.SHOT_OFF) ps.shotsOff++
          if (e.type === EVENT.YELLOW)   { ps.yellow++; if (e.reason) ps.yellowReasons[e.reason] = (ps.yellowReasons[e.reason] ?? 0) + 1 }
          if (e.type === EVENT.RED)      { ps.red++;    if (e.reason) ps.redReasons[e.reason]    = (ps.redReasons[e.reason]    ?? 0) + 1 }
          if (e.type === EVENT.DANGER)   ps.danger++
          if (e.type === EVENT.SAVE)     ps.saves++
          if (e.type === EVENT.BIG_SAVE) ps.bigSaves++
        }

        if (e.type === EVENT.GOAL && e.assistPlayerId) {
          ensurePlayer(e.assistPlayerId)
          raw[e.assistPlayerId].assists++
          raw[e.assistPlayerId].matchIds.add(match.id)
        }
      }
    }

    // ── Derived team metrics ─────────────────────────────────────────────────
    const n            = finished.length || 1
    const totalShots   = totalShotsOn + totalShotsOff
    const shotAccuracy = totalShots > 0 ? Math.round((totalShotsOn / totalShots) * 100) : 0
    const points       = record.W * 3 + record.D
    const winRate      = record.played > 0 ? Math.round((record.W / record.played) * 100) : 0

    // Goal origin as percentages (only tagged goals count)
    const taggedGoals = Object.values(goalOriginCount).reduce((s, v) => s + v, 0)
    const goalOriginData = GOAL_TYPES.map(gt => ({
      label: gt.label,
      emoji: gt.emoji,
      value: goalOriginCount[gt.value] ?? 0,
      pct:   taggedGoals > 0 ? Math.round(((goalOriginCount[gt.value] ?? 0) / taggedGoals) * 100) : 0,
      color: 'emerald',
    }))

    // ── Per-player stats ─────────────────────────────────────────────────────
    const playerStats = Object.entries(raw)
      .map(([pid, acc]) => {
        const p = players.find(pl => pl.id === pid)
        return {
          playerId:     pid,
          name:         p?.name     ?? 'Unknown',
          number:       p?.number,
          position:     p?.position,
          goals:        acc.goals,
          ownGoals:     acc.ownGoals,
          assists:      acc.assists,
          goalContribs: acc.goals + acc.assists,
          shotsOn:      acc.shotsOn,
          shotsOff:     acc.shotsOff,
          yellow:       acc.yellow,
          red:          acc.red,
          danger:       acc.danger,
          saves:        acc.saves,
          bigSaves:     acc.bigSaves,
          totalSaves:   acc.saves + acc.bigSaves,
          yellowReasons: acc.yellowReasons,
          redReasons:   acc.redReasons,
          minutesPlayed: acc.minutesPlayed,
          played:       acc.matchIds.size,
        }
      })
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists || b.minutesPlayed - a.minutesPlayed)

    // ── GK efficiency ────────────────────────────────────────────────────────
    // For each GK: save rate = totalSaves / (totalSaves + goals conceded in
    // matches they played).  Uses the per-match score recomputed from events.
    const gkStats = playerStats
      .filter(ps => ps.position === 'GK')
      .map(ps => {
        const gkMatches = finished.filter(m => calcMinutesPlayed(m, ps.playerId) > 0)
        const goalsAgainstInGKMatches = gkMatches.reduce((sum, m) => {
          const s = computeScore(m.events ?? [])
          return sum + s.away
        }, 0)
        const denom      = ps.totalSaves + goalsAgainstInGKMatches
        const efficiency = denom > 0 ? Math.round((ps.totalSaves / denom) * 100) : null
        return {
          ...ps,
          goalsAgainst: goalsAgainstInGKMatches,
          saveEfficiency: efficiency,
          matchesPlayed:  gkMatches.length,
        }
      })
      .filter(gk => gk.matchesPlayed > 0)
      .sort((a, b) => (b.saveEfficiency ?? -1) - (a.saveEfficiency ?? -1))

    // ── Goal contributions leaderboard (G+A) ─────────────────────────────────
    const goalContribs = [...playerStats]
      .filter(ps => ps.goalContribs > 0)
      .sort((a, b) => b.goalContribs - a.goalContribs || b.goals - a.goals)
      .map(ps => ({
        name:   ps.name,
        number: ps.number,
        value:  ps.goalContribs,
        sub:    `${ps.goals}G + ${ps.assists}A`,
      }))

    // ── Disciplinary / Fair Play table ───────────────────────────────────────
    const disciplinary = playerStats
      .filter(ps => ps.yellow > 0 || ps.red > 0)
      .sort((a, b) => (b.red * 3 + b.yellow) - (a.red * 3 + a.yellow))
      .map(ps => ({
        playerId: ps.playerId,
        name:     ps.name,
        number:   ps.number,
        position: ps.position,
        yellow:   ps.yellow,
        red:      ps.red,
        topYellowReason: Object.entries(ps.yellowReasons).sort((a,b) => b[1]-a[1])[0]?.[0] ?? null,
        topRedReason:    Object.entries(ps.redReasons).sort((a,b) => b[1]-a[1])[0]?.[0] ?? null,
      }))

    return {
      record,
      points,
      winRate,
      goalsFor,
      goalsAgainst,
      totalShots,
      totalShotsOn,
      totalShotsOff,
      totalGoals,
      totalOwnGoals,
      totalDanger,
      totalYellows,
      totalReds,
      totalSaves,
      totalBigSaves,
      shotAccuracy,
      goalOriginData,
      gkStats,
      goalContribs,
      disciplinary,
      playerStats,
      finishedMatches: finished,
      avgGoalsFor:     (goalsFor / n).toFixed(1),
      avgGoalsAgainst: (goalsAgainst / n).toFixed(1),
      avgShotsOn:      (totalShotsOn / n).toFixed(1),
      avgDanger:       (totalDanger / n).toFixed(1),
    }
  }, [matchHistory, players])
}
