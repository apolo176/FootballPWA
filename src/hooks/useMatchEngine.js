import { useEffect, useRef, useCallback, useState } from 'react'
import { useMatchStore } from '../store/matchStore'
import { PHASE } from '../lib/constants'

/**
 * Manages the match timer and exposes all in-game actions.
 * Zero UI logic — this hook is 100% portable to React Native.
 * All store mutations go through here so pages stay purely presentational.
 */
export function useMatchEngine() {
  const {
    activeMatch,
    kickOff: storeKickOff,
    endHalf,
    startSecondHalf,
    finishMatch,
    logEvent,
    removeEvent,
    setElapsed,
  } = useMatchStore()

  const intervalRef = useRef(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  const isLive    = activeMatch?.phase === PHASE.LIVE
  const elapsed   = activeMatch?.elapsedSeconds ?? 0
  const minute    = Math.floor(elapsed / 60)

  // ── Timer primitives ─────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    if (intervalRef.current) return
    setIsTimerRunning(true)
    intervalRef.current = setInterval(() => {
      const s = useMatchStore.getState().activeMatch?.elapsedSeconds ?? 0
      setElapsed(s + 1)
    }, 1000)
  }, [setElapsed])

  const stopTimer = useCallback(() => {
    setIsTimerRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Auto-start when match goes live; stop when it stops being live.
  useEffect(() => {
    if (isLive && !intervalRef.current) startTimer()
    if (!isLive) stopTimer()
  }, [isLive]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopTimer(), [stopTimer])

  // ── Public actions ───────────────────────────────────────────────────────

  const kickOff = useCallback(() => {
    storeKickOff()
    startTimer()
  }, [storeKickOff, startTimer])

  const pauseResume = useCallback(() => {
    if (intervalRef.current) stopTimer()
    else startTimer()
  }, [startTimer, stopTimer])

  const recordEvent = useCallback((type, extras = {}) => {
    logEvent({ type, ...extras })
    if (navigator.vibrate) navigator.vibrate(40)
  }, [logEvent])

  const handleEndHalf = useCallback(() => {
    stopTimer()
    endHalf()
  }, [stopTimer, endHalf])

  const handleSecondHalf = useCallback(() => {
    startSecondHalf()
    startTimer()
  }, [startSecondHalf, startTimer])

  const handleFinish = useCallback(() => {
    stopTimer()
    finishMatch()
  }, [stopTimer, finishMatch])

  return {
    match: activeMatch,
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
