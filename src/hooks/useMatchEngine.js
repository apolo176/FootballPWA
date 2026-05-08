import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useMatchStore, getElapsedSeconds } from '../store/matchStore'
import { EVENT, PHASE } from '../lib/constants'

/**
 * Single source of truth for in-game state.
 *
 * Timer:  wall-clock immune to background throttling (Date.now() − timerStartedAt).
 *         setInterval is a DISPLAY TICKER only — never writes to the store.
 *
 * activePlayers: IDs currently on the pitch, kept in sync with substitution
 *               and red-card events.  This is the authoritative list for all
 *               event-attribution flows (goal scorer, card recipient, save).
 *
 * availableBench: setup-bench players who have NOT yet come on — the pool
 *               from which substitutes are drawn.
 */
export function useMatchEngine() {
  const {
    activeMatch,
    kickOff:           storeKickOff,
    startTimer:        storeStartTimer,
    pauseTimer:        storePauseTimer,
    endHalf:           storeEndHalf,
    startSecondHalf:   storeStartSecondHalf,
    finishMatch:       storeFinishMatch,
    logEvent,
    removeEvent,
  } = useMatchStore()

  // ── Display ticker ────────────────────────────────────────────────────────
  const [, setTick] = useState(0)
  const tickRef     = useRef(null)

  const isTimerRunning = !!activeMatch?.timerStartedAt
  const isLive         = activeMatch?.phase === PHASE.LIVE

  useEffect(() => {
    if (isTimerRunning) {
      tickRef.current = setInterval(() => setTick(t => t + 1), 1000)
    } else {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
    return () => clearInterval(tickRef.current)
  }, [isTimerRunning])

  const elapsed = getElapsedSeconds(activeMatch)
  const minute  = Math.floor(elapsed / 60)

  // ── Active players on the pitch ──────────────────────────────────────────
  // Walk every SUB and RED event in order, mirroring what happened on the
  // pitch.  This replaces the old per-component currentOnPitch useMemo.
  const activePlayers = useMemo(() => {
    if (!activeMatch?.lineup) return []
    const onPitch = [...activeMatch.lineup]
    for (const e of activeMatch.events ?? []) {
      if (e.type === EVENT.SUB && e.playerId && e.subPlayerId) {
        const idx = onPitch.indexOf(e.playerId)
        if (idx !== -1) {
          onPitch.splice(idx, 1, e.subPlayerId)        // swap out → in
        } else if (!onPitch.includes(e.subPlayerId)) {
          onPitch.push(e.subPlayerId)                  // safety: add if missing
        }
      }
      if (e.type === EVENT.RED && e.playerId) {
        const idx = onPitch.indexOf(e.playerId)
        if (idx !== -1) onPitch.splice(idx, 1)        // remove from pitch
      }
    }
    return onPitch
  }, [activeMatch?.lineup, activeMatch?.events])

  // Bench players who have NOT yet come on (available for substitution)
  const availableBench = useMemo(() => {
    const pitchSet = new Set(activePlayers)
    return (activeMatch?.bench ?? []).filter(id => !pitchSet.has(id))
  }, [activePlayers, activeMatch?.bench])

  // ── Public actions ────────────────────────────────────────────────────────

  const kickOff = useCallback(() => {
    storeKickOff()
    if (navigator.vibrate) navigator.vibrate([50, 30, 50])
  }, [storeKickOff])

  const pauseResume = useCallback(() => {
    if (isTimerRunning) storePauseTimer()
    else storeStartTimer()
  }, [isTimerRunning, storePauseTimer, storeStartTimer])

  const recordEvent = useCallback((type, extras = {}) => {
    logEvent({ type, ...extras })
    if (navigator.vibrate) navigator.vibrate(40)
  }, [logEvent])

  const handleEndHalf = useCallback(() => {
    storeEndHalf()
  }, [storeEndHalf])

  const handleSecondHalf = useCallback(() => {
    storeStartSecondHalf()
  }, [storeStartSecondHalf])

  const handleFinish = useCallback(() => {
    storeFinishMatch()
  }, [storeFinishMatch])

  return {
    match:          activeMatch,
    elapsed,
    minute,
    isLive,
    isTimerRunning,
    activePlayers,    // ← canonical on-pitch list
    availableBench,   // ← not-yet-used bench players
    kickOff,
    pauseResume,
    recordEvent,
    removeEvent,
    handleEndHalf,
    handleSecondHalf,
    handleFinish,
  }
}
