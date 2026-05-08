import { useEffect, useRef, useState, useCallback } from 'react'
import { useMatchStore, getElapsedSeconds } from '../store/matchStore'
import { PHASE } from '../lib/constants'

/**
 * Manages the match timer display and exposes all in-game actions.
 *
 * Timer design — immune to background tab throttling / phone sleep:
 *   - Zustand stores timerStartedAt (epoch ms) and timerAccumulated (seconds).
 *   - setInterval here is a DISPLAY TICKER only — it triggers re-renders so
 *     the scoreboard clock updates every second. It never writes to the store.
 *   - Elapsed time is always computed from Date.now() − timerStartedAt,
 *     so a 30-second background delay shows the correct 30-second jump.
 *
 * Portable to React Native (replace setInterval with BackgroundTimer).
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
  // Forces a re-render every second so the clock stays in sync with Date.now().
  const [, setTick] = useState(0)
  const tickRef = useRef(null)

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

  // Always computed fresh — never stale from a throttled interval
  const elapsed = getElapsedSeconds(activeMatch)
  const minute  = Math.floor(elapsed / 60)

  // ── Public actions ────────────────────────────────────────────────────────

  const kickOff = useCallback(() => {
    storeKickOff()   // sets phase=LIVE, timerStartedAt=Date.now()
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
    storeEndHalf()    // pauses timer + adds half_time event with wall-clock elapsed
  }, [storeEndHalf])

  const handleSecondHalf = useCallback(() => {
    storeStartSecondHalf()   // resumes timer + adds second_half event
  }, [storeStartSecondHalf])

  const handleFinish = useCallback(() => {
    storeFinishMatch()   // pauses timer + snapshots elapsed + adds match_end event
  }, [storeFinishMatch])

  return {
    match:          activeMatch,
    elapsed,
    minute,
    isLive,
    isTimerRunning,
    kickOff,
    pauseResume,
    recordEvent,
    removeEvent,
    handleEndHalf,
    handleSecondHalf,
    handleFinish,
  }
}
