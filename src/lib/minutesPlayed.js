import { EVENT } from './constants'

/**
 * Calculate the minutes a specific player was on the pitch in one match.
 *
 * Clock model:
 *   - Starting XI → starts at second 0
 *   - Substituted on (SUB, subPlayerId) → starts at that event's second
 *   - Substituted off (SUB, playerId) → stops at that event's second
 *   - Sent off (RED, playerId) → stops at that event's second
 *   - Still playing at match end → stops at matchEnd (see below)
 *
 * matchEnd heuristic — in order of preference:
 *   1. match.elapsedSeconds if > 60 (timer was actually running)
 *   2. The latest event timestamp in the match (timer started late or was paused)
 *   3. 90 minutes (timer was never started at all)
 *
 * Returns whole minutes. Returns 0 if the player never set foot on the pitch.
 */
export function calcMinutesPlayed(match, playerId) {
  const events = (match.events ?? []).slice().sort((a, b) => a.elapsedSeconds - b.elapsedSeconds)
  const lineup = match.lineup ?? []

  // Resolve a sensible match duration even when the timer wasn't running
  const lastEventSecs = events.reduce((max, e) => Math.max(max, e.elapsedSeconds ?? 0), 0)
  const matchEnd =
    (match.elapsedSeconds ?? 0) > 60 ? match.elapsedSeconds :
    lastEventSecs > 60              ? lastEventSecs          :
    90 * 60                          // fallback: assume 90-minute match

  let startSecs = lineup.includes(playerId) ? 0 : null
  let endSecs   = null

  for (const e of events) {
    if (e.type === EVENT.SUB && e.subPlayerId === playerId && startSecs === null)
      startSecs = e.elapsedSeconds
    if (e.type === EVENT.SUB && e.playerId === playerId && endSecs === null)
      endSecs = e.elapsedSeconds
    if (e.type === EVENT.RED && e.playerId === playerId && endSecs === null)
      endSecs = e.elapsedSeconds
  }

  if (startSecs === null) return 0
  return Math.max(0, Math.floor(((endSecs ?? matchEnd) - startSecs) / 60))
}

/** Aggregate minutes across multiple matches. */
export function calcSeasonMinutes(matches, playerId) {
  return matches.reduce((acc, m) => acc + calcMinutesPlayed(m, playerId), 0)
}
