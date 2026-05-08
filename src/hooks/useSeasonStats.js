import { useMemo } from 'react'
import { useMatchStore } from '../store/matchStore'
import { useRosterStore } from '../store/rosterStore'
import { EVENT, PHASE } from '../lib/constants'
import { getMatchResult } from '../lib/utils'
import { calcMinutesPlayed } from '../lib/minutesPlayed'

/**
 * Aggregates season-wide stats from matchHistory.
 *
 * Defensive guarantees:
 *   - Deduplicates by match ID before iterating (immune to the startNewMatch
 *     double-push bug and React 18 StrictMode double-invoke).
 *   - Pure computation — no mutations, no side effects, React Native portable.
 */
export function useSeasonStats() {
  const { matchHistory } = useMatchStore()
  const { players }      = useRosterStore()

  return useMemo(() => {
    // ── Deduplicate by ID (last write wins) ──────────────────────────────────
    const byId = new Map()
    for (const m of matchHistory) {
      if (m.phase === PHASE.POST) byId.set(m.id, m)
    }
    const finished = [...byId.values()]

    // ── Team totals ──────────────────────────────────────────────────────────
    const record = { W: 0, D: 0, L: 0, played: finished.length }
    let goalsFor = 0, goalsAgainst = 0
    let totalShotsOn = 0, totalShotsOff = 0
    let totalGoals = 0, totalDanger = 0
    let totalYellows = 0, totalReds = 0

    // ── Per-player accumulators ──────────────────────────────────────────────
    // Keyed by playerId. matchIds is a Set so appearances auto-deduplicate.
    const raw = {}

    const ensurePlayer = (id) => {
      if (!raw[id]) {
        raw[id] = {
          goals: 0, assists: 0, shotsOn: 0, shotsOff: 0,
          yellow: 0, red: 0, danger: 0,
          minutesPlayed: 0,
          matchIds: new Set(),
        }
      }
    }

    for (const match of finished) {
      const score  = match.score ?? { home: 0, away: 0 }
      const result = getMatchResult(score)
      record[result]++
      goalsFor     += score.home
      goalsAgainst += score.away

      // ── Minutes played for every player who appeared in this match ─────────
      // Collect unique participant IDs: lineup + anyone mentioned in events
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
        // Team-level
        if (e.type === EVENT.SHOT_ON)  totalShotsOn++
        if (e.type === EVENT.SHOT_OFF) totalShotsOff++
        if (e.type === EVENT.GOAL)     totalGoals++
        if (e.type === EVENT.DANGER)   totalDanger++
        if (e.type === EVENT.YELLOW)   totalYellows++
        if (e.type === EVENT.RED)      totalReds++

        // Scorer / card recipient / action player
        if (e.playerId) {
          ensurePlayer(e.playerId)
          raw[e.playerId].matchIds.add(match.id)
          if (e.type === EVENT.GOAL)     raw[e.playerId].goals++
          if (e.type === EVENT.SHOT_ON)  raw[e.playerId].shotsOn++
          if (e.type === EVENT.SHOT_OFF) raw[e.playerId].shotsOff++
          if (e.type === EVENT.YELLOW)   raw[e.playerId].yellow++
          if (e.type === EVENT.RED)      raw[e.playerId].red++
          if (e.type === EVENT.DANGER)   raw[e.playerId].danger++
        }

        // Assist provider (lives on a goal event's assistPlayerId)
        if (e.type === EVENT.GOAL && e.assistPlayerId) {
          ensurePlayer(e.assistPlayerId)
          raw[e.assistPlayerId].assists++
          raw[e.assistPlayerId].matchIds.add(match.id)
        }
      }
    }

    // ── Enrich with roster data ───────────────────────────────────────────────
    const totalShots   = totalShotsOn + totalShotsOff
    const shotAccuracy = totalShots > 0 ? Math.round((totalShotsOn / totalShots) * 100) : 0
    const n            = finished.length || 1

    const playerStats = Object.entries(raw)
      .map(([pid, acc]) => {
        const p = players.find(pl => pl.id === pid)
        return {
          playerId:     pid,
          name:         p?.name     ?? 'Unknown',
          number:       p?.number,
          position:     p?.position,
          goals:        acc.goals,
          assists:      acc.assists,
          shotsOn:      acc.shotsOn,
          shotsOff:     acc.shotsOff,
          yellow:       acc.yellow,
          red:          acc.red,
          danger:       acc.danger,
          minutesPlayed:acc.minutesPlayed,
          played:       acc.matchIds.size,
        }
      })
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists || b.minutesPlayed - a.minutesPlayed)

    return {
      record,
      goalsFor,
      goalsAgainst,
      totalShots,
      totalShotsOn,
      totalShotsOff,
      totalGoals,
      totalDanger,
      totalYellows,
      totalReds,
      shotAccuracy,
      playerStats,
      finishedMatches: finished,
      avgGoalsFor:     (goalsFor / n).toFixed(1),
      avgGoalsAgainst: (goalsAgainst / n).toFixed(1),
      avgShotsOn:      (totalShotsOn / n).toFixed(1),
      avgDanger:       (totalDanger / n).toFixed(1),
    }
  }, [matchHistory, players])
}
