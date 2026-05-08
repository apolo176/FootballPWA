import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId } from '../lib/utils'

export const useTrainingStore = create(
  persist(
    (set) => ({
      drills: [],

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
    }),
    { name: 'football-dss-training' }
  )
)
