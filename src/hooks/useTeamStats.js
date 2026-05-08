import { useMemo } from 'react'
import { EVENT } from '../lib/constants'
import { computeScore, computeStats } from '../lib/utils'
import { calcMinutesPlayed } from '../lib/minutesPlayed'
import { useRosterStore } from '../store/rosterStore'

const POS_ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 }

/** Derives per-match analytics from a single match's event log. */
export function useTeamStats(match) {
  const { players } = useRosterStore()

  return useMemo(() => {
    if (!match) return null

    const events = match.events ?? []
    const score  = computeScore(events)
    const stats  = computeStats(events, players)

    // ── Timeline ────────────────────────────────────────────────────────────
    const timeline = [...events]
      .sort((a, b) => a.elapsedSeconds - b.elapsedSeconds)
      .map(e => {
        const player       = players.find(p => p.id === e.playerId)
        const subPlayer    = players.find(p => p.id === e.subPlayerId)
        const assistPlayer = e.assistPlayerId ? players.find(p => p.id === e.assistPlayerId) : null
        return {
          ...e,
          playerName:       player?.name,
          playerNumber:     player?.number,
          subPlayerName:    subPlayer?.name,
          assistPlayerName: assistPlayer?.name,
        }
      })

    // ── Per-player stats ─────────────────────────────────────────────────────
    // Base pool: EVERYONE who actually stepped onto the pitch this match.
    //   • Starting XI  → in match.lineup
    //   • Substituted on → appear as subPlayerId in a SUB event
    // Bench players who never came on are intentionally excluded.
    const startingIds = new Set(match.lineup ?? [])
    const subOnIds    = new Set(
      events
        .filter(e => e.type === EVENT.SUB && e.subPlayerId)
        .map(e => e.subPlayerId)
    )
    const playedIds = new Set([...startingIds, ...subOnIds])

    const rosterStats = [...playedIds]
      .map(pid => {
        const ps     = stats.playerStats[pid] ?? {}
        const player = players.find(p => p.id === pid)
        return {
          goals:        ps.goals   ?? 0,
          assists:      ps.assists  ?? 0,
          shotsOn:      ps.shotsOn  ?? 0,
          shotsOff:     ps.shotsOff ?? 0,
          yellow:       ps.yellow   ?? 0,
          red:          ps.red      ?? 0,
          danger:       ps.danger   ?? 0,
          playerId:     pid,
          name:         player?.name     ?? 'Unknown',
          number:       player?.number,
          position:     player?.position ?? 'MID',
          minutesPlayed: calcMinutesPlayed(match, pid),
          started:      startingIds.has(pid),
        }
      })
      // Sort: most minutes first → then by position
      .sort((a, b) =>
        b.minutesPlayed - a.minutesPlayed ||
        (POS_ORDER[a.position] ?? 9) - (POS_ORDER[b.position] ?? 9)
      )

    // ── Team-level aggregates ────────────────────────────────────────────────
    const danger  = events.filter(e => e.type === EVENT.DANGER).length
    const yellows = events.filter(e => e.type === EVENT.YELLOW).length
    const reds    = events.filter(e => e.type === EVENT.RED).length

    return {
      score, timeline, rosterStats,
      shotsOn:      stats.shotsOn,
      shotsOff:     stats.shotsOff,
      goals:        stats.goals,
      totalShots:   stats.totalShots,
      shotAccuracy: stats.shotAccuracy,
      danger, yellows, reds,
    }
  }, [match, players])
}
