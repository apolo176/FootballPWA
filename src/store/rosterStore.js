import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId } from '../lib/utils'

const SEED_PLAYERS = [
  { id: 'p1',  name: 'Carlos López',    number: 1,  position: 'GK',  status: 'available' },
  { id: 'p2',  name: 'Miguel Torres',   number: 4,  position: 'DEF', status: 'available' },
  { id: 'p3',  name: 'Andrés Martín',   number: 5,  position: 'DEF', status: 'available' },
  { id: 'p4',  name: 'David Ruiz',      number: 6,  position: 'DEF', status: 'available' },
  { id: 'p5',  name: 'Sergio Díaz',     number: 3,  position: 'DEF', status: 'available' },
  { id: 'p6',  name: 'Pablo García',    number: 8,  position: 'MID', status: 'available' },
  { id: 'p7',  name: 'Javier Morales',  number: 10, position: 'MID', status: 'available' },
  { id: 'p8',  name: 'Luis Fernández',  number: 6,  position: 'MID', status: 'available' },
  { id: 'p9',  name: 'Raúl Sánchez',   number: 11, position: 'FWD', status: 'available' },
  { id: 'p10', name: 'Marcos Jiménez',  number: 9,  position: 'FWD', status: 'available' },
  { id: 'p11', name: 'Iván Álvarez',   number: 7,  position: 'FWD', status: 'available' },
  { id: 'p12', name: 'Tomás Delgado',  number: 13, position: 'GK',  status: 'available' },
  { id: 'p13', name: 'Daniel Vargas',  number: 15, position: 'DEF', status: 'available' },
  { id: 'p14', name: 'Nicolás Reyes',  number: 16, position: 'MID', status: 'available' },
  { id: 'p15', name: 'Gabriel Castro', number: 17, position: 'FWD', status: 'available' },
]

export const useRosterStore = create(
  persist(
    (set, get) => ({
      players: SEED_PLAYERS,

      addPlayer: (data) => {
        const player = { id: generateId(), status: 'available', ...data }
        set(s => ({ players: [...s.players, player] }))
        return player
      },

      updatePlayer: (id, data) =>
        set(s => ({ players: s.players.map(p => p.id === id ? { ...p, ...data } : p) })),

      setPlayerStatus: (id, status) =>
        set(s => ({ players: s.players.map(p => p.id === id ? { ...p, status } : p) })),

      removePlayer: (id) =>
        set(s => ({ players: s.players.filter(p => p.id !== id) })),

      getPlayer: (id) => get().players.find(p => p.id === id),
    }),
    { name: 'football-dss-roster' }
  )
)
