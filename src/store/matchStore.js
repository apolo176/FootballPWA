import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PHASE, EVENT } from '../lib/constants'
import { generateId, computeScore } from '../lib/utils'

const freshMatch = (data) => ({
  id: generateId(),
  createdAt: new Date().toISOString(),
  date: data.date ?? new Date().toISOString().slice(0, 10),
  opponent: data.opponent ?? 'Opponent',
  venue: data.venue ?? 'home',
  stadium: data.stadium ?? '',
  competition: data.competition ?? '',
  referee: data.referee ?? '',
  formation: data.formation ?? '4-3-3',
  assignments: data.assignments ?? {},  // slotId → playerId (visual pitch state)
  lineup: data.lineup ?? [],            // derived: Object.values(assignments)
  bench: data.bench ?? [],
  phase: PHASE.PRE,
  elapsedSeconds: 0,
  score: { home: 0, away: 0 },
  events: [],
})

// Storage key bumped to v2 so legacy data doesn't corrupt the new shape.
export const useMatchStore = create(
  persist(
    (set, get) => ({
      activeMatch: null,
      matchHistory: [],    // finished matches (phase POST or force-archived)

      // ─── Setup ───────────────────────────────────────────────────────────────

      startNewMatch: (data) => {
        const match = freshMatch(data)
        set(s => {
          // Deduplicated archive: finishMatch() already wrote activeMatch into history,
          // so we must filter by ID before prepending to avoid double entries.
          const history = s.activeMatch
            ? [s.activeMatch, ...s.matchHistory.filter(m => m.id !== s.activeMatch.id)]
            : s.matchHistory
          return { activeMatch: match, matchHistory: history }
        })
        return match
      },

      updateSetup: (data) =>
        set(s => ({
          activeMatch: s.activeMatch ? { ...s.activeMatch, ...data } : null,
        })),

      // ─── Match lifecycle ──────────────────────────────────────────────────────

      kickOff: () =>
        set(s => {
          if (!s.activeMatch) return s
          return {
            activeMatch: {
              ...s.activeMatch,
              phase: PHASE.LIVE,
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
          return {
            activeMatch: {
              ...s.activeMatch,
              events: [
                ...s.activeMatch.events,
                { id: generateId(), type: EVENT.HALF_TIME, timestamp: Date.now(), elapsedSeconds: s.activeMatch.elapsedSeconds },
              ],
            },
          }
        }),

      startSecondHalf: () =>
        set(s => {
          if (!s.activeMatch) return s
          return {
            activeMatch: {
              ...s.activeMatch,
              events: [
                ...s.activeMatch.events,
                { id: generateId(), type: EVENT.SECOND_HALF, timestamp: Date.now(), elapsedSeconds: s.activeMatch.elapsedSeconds },
              ],
            },
          }
        }),

      // Pushes activeMatch into matchHistory (as POST) and keeps it visible for review.
      // The caller navigates to /stats after this.
      finishMatch: () =>
        set(s => {
          // Idempotent guard: already finished (e.g. StrictMode double-invoke)
          if (!s.activeMatch || s.activeMatch.phase === PHASE.POST) return s
          const finished = {
            ...s.activeMatch,
            phase: PHASE.POST,
            events: [
              ...s.activeMatch.events,
              { id: generateId(), type: EVENT.MATCH_END, timestamp: Date.now(), elapsedSeconds: s.activeMatch.elapsedSeconds },
            ],
          }
          return {
            activeMatch: finished,
            matchHistory: [finished, ...s.matchHistory.filter(m => m.id !== finished.id)],
          }
        }),

      // Hard-clear the active match (used by Settings "clear active" or "New Match" after review)
      clearActiveMatch: () => set({ activeMatch: null }),

      // ─── Events ──────────────────────────────────────────────────────────────

      logEvent: (eventData) =>
        set(s => {
          if (!s.activeMatch) return s
          const event = {
            id: generateId(),
            timestamp: Date.now(),
            elapsedSeconds: s.activeMatch.elapsedSeconds,
            ...eventData,
          }
          const events = [...s.activeMatch.events, event]
          const score = computeScore(events)
          return { activeMatch: { ...s.activeMatch, events, score } }
        }),

      removeEvent: (eventId) =>
        set(s => {
          if (!s.activeMatch) return s
          const events = s.activeMatch.events.filter(e => e.id !== eventId)
          const score = computeScore(events)
          return { activeMatch: { ...s.activeMatch, events, score } }
        }),

      setElapsed: (seconds) =>
        set(s => ({
          activeMatch: s.activeMatch ? { ...s.activeMatch, elapsedSeconds: seconds } : null,
        })),

      // ─── History management ───────────────────────────────────────────────────

      deleteMatch: (id) =>
        set(s => ({
          activeMatch: s.activeMatch?.id === id ? null : s.activeMatch,
          matchHistory: s.matchHistory.filter(m => m.id !== id),
        })),

      clearAllData: () => set({ activeMatch: null, matchHistory: [] }),
    }),
    { name: 'football-dss-matches-v2' }
  )
)
