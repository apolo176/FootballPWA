import { useMemo } from 'react'
import { EVENT } from '../lib/constants'
import { computeScore, computeStats } from '../lib/utils'
import { useRosterStore } from '../store/rosterStore'

/** Derives per-match analytics from a single match's event log. */
export function useTeamStats(match) {
  const { players } = useRosterStore()

  return useMemo(() => {
    if (!match) return null

    const events = match.events ?? []
    const score  = computeScore(events)
    const stats  = computeStats(events, players)  // now includes assists

    const timeline = [...events]
      .sort((a, b) => a.elapsedSeconds - b.elapsedSeconds)
      .map(e => {
        const player      = players.find(p => p.id === e.playerId)
        const subPlayer   = players.find(p => p.id === e.subPlayerId)
        const assistPlayer = e.assistPlayerId ? players.find(p => p.id === e.assistPlayerId) : null
        return {
          ...e,
          playerName:       player?.name,
          playerNumber:     player?.number,
          subPlayerName:    subPlayer?.name,
          assistPlayerName: assistPlayer?.name,
          // e.reason is passed through as-is
        }
      })

    const rosterStats = Object.entries(stats.playerStats)
      .map(([pid, ps]) => {
        const player = players.find(p => p.id === pid)
        return {
          ...ps,
          playerId: pid,
          name:     player?.name ?? 'Unknown',
          number:   player?.number,
          position: player?.position,
        }
      })
      .sort((a, b) => (b.goals + b.assists + b.shotsOn) - (a.goals + a.assists + a.shotsOn))

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
