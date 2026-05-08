import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSettingsStore = create(
  persist(
    (set) => ({
      teamName: 'My Team',
      matchDuration: 90,         // minutes per half (total game = 2x)
      defaultFormation: '4-3-3',
      theme: 'dark',

      setTeamName: (name) => set({ teamName: name }),
      setMatchDuration: (min) => set({ matchDuration: Number(min) }),
      setDefaultFormation: (f) => set({ defaultFormation: f }),
      setTheme: (t) => set({ theme: t }),
    }),
    { name: 'football-dss-settings' }
  )
)
