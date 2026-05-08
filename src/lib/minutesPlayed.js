import { EVENT } from './constants'

/**
 * Calculate the minutes a specific player was on the pitch in one match.
 *
 * Clock model:
 *   - Starting XI → starts at second 0
 *   - Substituted on (SUB, subPlayerId) → starts at event second
 *   - Substituted off (SUB, playerId) → stops at event second
 *   - Sent off (RED, playerId) → stops at event second
 *   - Still on pitch at match end → stops at match.elapsedSeconds
 *
 * Returns whole minutes (number). Returns 0 if the player never took the pitch.
 */
export function calcMinutesPlayed(match, playerId) {
  const events   = (match.events ?? []).slice().sort((a, b) => a.elapsedSeconds - b.elapsedSeconds)
  const lineup   = match.lineup ?? []
  const matchEnd = match.elapsedSeconds ?? 0

  let startSecs = lineup.includes(playerId) ? 0 : null
  let endSecs   = null

  for (const e of events) {
    // Came on as substitute
    if (e.type === EVENT.SUB && e.subPlayerId === playerId && startSecs === null) {
      startSecs = e.elapsedSeconds
    }
    // Substituted off
    if (e.type === EVENT.SUB && e.playerId === playerId && endSecs === null) {
      endSecs = e.elapsedSeconds
    }
    // Sent off (red card)
    if (e.type === EVENT.RED && e.playerId === playerId && endSecs === null) {
      endSecs = e.elapsedSeconds
    }
  }

  if (startSecs === null) return 0
  return Math.max(0, Math.floor(((endSecs ?? matchEnd) - startSecs) / 60))
}

/** Sum minutes played across multiple matches. */
export function calcSeasonMinutes(matches, playerId) {
  return matches.reduce((acc, m) => acc + calcMinutesPlayed(m, playerId), 0)
}
