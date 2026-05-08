import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId } from '../lib/utils'

export const useTrainingStore = create(
  persist(
    (set) => ({
      drills: [],
      trainingHistory: [],   // Array<{ id, date, attendance: { [playerId]: 'attended'|'excused'|'absent' } }>

      // ── Drills ──────────────────────────────────────────────────────────

      addDrill: (data) => {
        const drill = {
          id: generateId(),
          createdAt: new Date().toISOString(),
          title: data.title ?? 'New Drill',
          description: data.description ?? '',
          tokens: data.tokens ?? [],
        }
        set(s => ({ drills: [drill, ...s.drills] }))
        return drill
      },

      updateDrill: (id, data) =>
        set(s => ({ drills: s.drills.map(d => d.id === id ? { ...d, ...data } : d) })),

      deleteDrill: (id) =>
        set(s => ({ drills: s.drills.filter(d => d.id !== id) })),

      // ── Training sessions ────────────────────────────────────────────────

      addSession: (date) => {
        const session = { id: generateId(), date, attendance: {} }
        set(s => ({ trainingHistory: [session, ...s.trainingHistory] }))
        return session
      },

      setAttendance: (sessionId, playerId, status) =>
        set(s => ({
          trainingHistory: s.trainingHistory.map(session => {
            if (session.id !== sessionId) return session
            const attendance = { ...session.attendance }
            if (status == null) {
              delete attendance[playerId]
            } else {
              attendance[playerId] = status
            }
            return { ...session, attendance }
          }),
        })),

      deleteSession: (id) =>
        set(s => ({ trainingHistory: s.trainingHistory.filter(s => s.id !== id) })),
    }),
    { name: 'football-dss-training' }
  )
)
