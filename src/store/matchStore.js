import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PHASE, EVENT } from '../lib/constants'
import { generateId, computeScore } from '../lib/utils'

// ── Wall-clock elapsed helper ─────────────────────────────────────────────────
// Source of truth is timerStartedAt (epoch ms) + timerAccumulated (seconds).
// setInterval is ONLY used for UI re-renders — it never writes state.
// This makes the timer immune to background tab throttling and phone sleep.
export function getElapsedSeconds(match) {
  if (!match) return 0
  const acc       = match.timerAccumulated ?? 0
  const startedAt = match.timerStartedAt
  if (!startedAt) return acc
  return acc + Math.floor((Date.now() - startedAt) / 1000)
}

const freshMatch = (data) => ({
  id:               generateId(),
  createdAt:        new Date().toISOString(),
  date:             data.date        ?? new Date().toISOString().slice(0, 10),
  opponent:         data.opponent    ?? 'Opponent',
  venue:            data.venue       ?? 'home',
  stadium:          data.stadium     ?? '',
  competition:      data.competition ?? '',
  referee:          data.referee     ?? '',
  formation:        data.formation   ?? '4-3-3',
  assignments:      data.assignments ?? {},
  lineup:           data.lineup      ?? [],
  bench:            data.bench       ?? [],
  phase:            PHASE.PRE,
  // Timer — wall-clock approach
  timerStartedAt:   null,   // epoch ms of last unpause (null = paused/stopped)
  timerAccumulated: 0,      // seconds banked from all previous timer runs
  elapsedSeconds:   0,      // snapshot at match end; kept for calcMinutesPlayed compat
  score:            { home: 0, away: 0 },
  events:           [],
})

export const useMatchStore = create(
  persist(
    (set) => ({
      activeMatch:  null,
      matchHistory: [],

      // ── Setup ──────────────────────────────────────────────────────────────

      startNewMatch: (data) => {
        const match = freshMatch(data)
        set(s => {
          const history = s.activeMatch
            ? [s.activeMatch, ...s.matchHistory.filter(m => m.id !== s.activeMatch.id)]
            : s.matchHistory
          return { activeMatch: match, matchHistory: history }
        })
        return match
      },

      updateSetup: (data) =>
        set(s => ({ activeMatch: s.activeMatch ? { ...s.activeMatch, ...data } : null })),

      // ── Timer actions (all wall-clock based) ──────────────────────────────

      startTimer: () =>
        set(s => ({
          activeMatch: s.activeMatch
            ? { ...s.activeMatch, timerStartedAt: Date.now() }
            : null,
        })),

      pauseTimer: () =>
        set(s => {
          if (!s.activeMatch?.timerStartedAt) return s
          const additional = Math.floor((Date.now() - s.activeMatch.timerStartedAt) / 1000)
          return {
            activeMatch: {
              ...s.activeMatch,
              timerStartedAt:   null,
              timerAccumulated: (s.activeMatch.timerAccumulated ?? 0) + additional,
            },
          }
        }),

      // ── Match lifecycle ────────────────────────────────────────────────────

      kickOff: () =>
        set(s => {
          if (!s.activeMatch) return s
          return {
            activeMatch: {
              ...s.activeMatch,
              phase:            PHASE.LIVE,
              timerStartedAt:   Date.now(),
              timerAccumulated: 0,
              events: [
                ...s.activeMatch.events,
                { id: generateId(), type: EVENT.MATCH_START, timestamp: Date.now(), elapsedSeconds: 0 },
              ],
            },
          }
        }),

      endHalf: () =>
        set(s => {
          if (!s.activeMatch) return s
          const elapsed = getElapsedSeconds(s.activeMatch)
          return {
            activeMatch: {
              ...s.activeMatch,
              timerStartedAt:   null,
              timerAccumulated: elapsed,
              events: [
                ...s.activeMatch.events,
                { id: generateId(), type: EVENT.HALF_TIME, timestamp: Date.now(), elapsedSeconds: elapsed },
              ],
            },
          }
        }),

      startSecondHalf: () =>
        set(s => {
          if (!s.activeMatch) return s
          const elapsed = getElapsedSeconds(s.activeMatch)
          return {
            activeMatch: {
              ...s.activeMatch,
              timerStartedAt: Date.now(),
              events: [
                ...s.activeMatch.events,
                { id: generateId(), type: EVENT.SECOND_HALF, timestamp: Date.now(), elapsedSeconds: elapsed },
              ],
            },
          }
        }),

      finishMatch: () =>
        set(s => {
          if (!s.activeMatch || s.activeMatch.phase === PHASE.POST) return s
          const elapsed = getElapsedSeconds(s.activeMatch)
          const finished = {
            ...s.activeMatch,
            phase:            PHASE.POST,
            timerStartedAt:   null,
            timerAccumulated: elapsed,
            elapsedSeconds:   elapsed,  // snapshot for calcMinutesPlayed
            events: [
              ...s.activeMatch.events,
              { id: generateId(), type: EVENT.MATCH_END, timestamp: Date.now(), elapsedSeconds: elapsed },
            ],
          }
          return {
            activeMatch:  finished,
            matchHistory: [finished, ...s.matchHistory.filter(m => m.id !== finished.id)],
          }
        }),

      clearActiveMatch: () => set({ activeMatch: null }),

      // ── Events ────────────────────────────────────────────────────────────

      logEvent: (eventData) =>
        set(s => {
          if (!s.activeMatch) return s
          // Compute elapsed from wall clock at the moment of the event — accurate
          // even if the display ticker was throttled in the background.
          const elapsedSeconds = getElapsedSeconds(s.activeMatch)
          const event = { id: generateId(), timestamp: Date.now(), elapsedSeconds, ...eventData }
          const events = [...s.activeMatch.events, event]
          const score  = computeScore(events)
          return { activeMatch: { ...s.activeMatch, events, score } }
        }),

      removeEvent: (eventId) =>
        set(s => {
          if (!s.activeMatch) return s
          const events = s.activeMatch.events.filter(e => e.id !== eventId)
          const score  = computeScore(events)
          return { activeMatch: { ...s.activeMatch, events, score } }
        }),

      // ── History ───────────────────────────────────────────────────────────

      deleteMatch: (id) =>
        set(s => ({
          activeMatch:  s.activeMatch?.id === id ? null : s.activeMatch,
          matchHistory: s.matchHistory.filter(m => m.id !== id),
        })),

      clearAllData: () => set({ activeMatch: null, matchHistory: [] }),
    }),
    { name: 'football-dss-matches-v2' }
  )
)
