import { clsx } from 'clsx'
import { EVENT, PHASE } from './constants'

export { clsx as cn }

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatMinute(seconds) {
  return `${Math.floor(seconds / 60)}'`
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function computeScore(events) {
  return events.reduce(
    (acc, e) => {
      if (e.type === EVENT.GOAL || e.type === EVENT.OWN_GOAL) acc.home++
      if (e.type === EVENT.GOAL_AGAINST) acc.away++
      return acc
    },
    { home: 0, away: 0 }
  )
}

export function computeStats(events, roster) {
  const shotsOn = events.filter(e => e.type === EVENT.SHOT_ON).length
  const shotsOff = events.filter(e => e.type === EVENT.SHOT_OFF).length
  const goals = events.filter(e => e.type === EVENT.GOAL || e.type === EVENT.OWN_GOAL).length
  const totalShots = shotsOn + shotsOff
  const shotAccuracy = totalShots > 0 ? Math.round((shotsOn / totalShots) * 100) : 0

  const ZERO = () => ({ goals: 0, assists: 0, shotsOn: 0, shotsOff: 0, yellow: 0, red: 0, danger: 0 })
  const playerStats = {}

  const ensure = (id) => { if (!playerStats[id]) playerStats[id] = ZERO() }

  for (const e of events) {
    if (e.playerId) {
      ensure(e.playerId)
      const ps = playerStats[e.playerId]
      if (e.type === EVENT.GOAL)     ps.goals++
      if (e.type === EVENT.SHOT_ON)  ps.shotsOn++
      if (e.type === EVENT.SHOT_OFF) ps.shotsOff++
      if (e.type === EVENT.YELLOW)   ps.yellow++
      if (e.type === EVENT.RED)      ps.red++
      if (e.type === EVENT.DANGER)   ps.danger++
    }
    // Assists live on the goal event's assistPlayerId field
    if (e.type === EVENT.GOAL && e.assistPlayerId) {
      ensure(e.assistPlayerId)
      playerStats[e.assistPlayerId].assists++
    }
  }

  return { shotsOn, shotsOff, goals, totalShots, shotAccuracy, playerStats }
}

export function getMatchResult(score) {
  if (score.home > score.away) return 'W'
  if (score.home < score.away) return 'L'
  return 'D'
}

export function getResultColor(result) {
  if (result === 'W') return 'text-emerald-400'
  if (result === 'L') return 'text-red-400'
  return 'text-amber-400'
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
