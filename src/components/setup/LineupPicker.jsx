import { useState } from 'react'
import { useRosterStore } from '../../store/rosterStore'
import { Badge } from '../ui/Badge'
import { cn } from '../../lib/utils'

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD']
const MAX_LINEUP = 11

export function LineupPicker({ lineup, bench, onChange }) {
  const { players } = useRosterStore()
  const [tab, setTab] = useState('lineup')

  const toggle = (playerId, target) => {
    let newLineup = [...lineup]
    let newBench = [...bench]

    const inLineup = newLineup.includes(playerId)
    const inBench = newBench.includes(playerId)

    if (target === 'lineup') {
      if (inLineup) {
        newLineup = newLineup.filter(id => id !== playerId)
      } else {
        newBench = newBench.filter(id => id !== playerId)
        if (newLineup.length < MAX_LINEUP) newLineup.push(playerId)
      }
    } else {
      if (inBench) {
        newBench = newBench.filter(id => id !== playerId)
      } else {
        newLineup = newLineup.filter(id => id !== playerId)
        newBench.push(playerId)
      }
    }

    onChange({ lineup: newLineup, bench: newBench })
  }

  const grouped = POSITIONS.map(pos => ({
    pos,
    players: players.filter(p => p.position === pos),
  }))

  return (
    <div className="space-y-4">
      {/* Tab: counts */}
      <div className="flex gap-2 bg-slate-800/60 rounded-xl p-1">
        {[
          { key: 'lineup', label: `Starters (${lineup.length}/11)` },
          { key: 'bench',  label: `Bench (${bench.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === t.key ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Player list */}
      <div className="space-y-4 max-h-80 overflow-y-auto no-scrollbar">
        {grouped.map(({ pos, players: grpPlayers }) => (
          <div key={pos}>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">{pos}</div>
            <div className="space-y-1.5">
              {grpPlayers.map(p => {
                const inLineup = lineup.includes(p.id)
                const inBench = bench.includes(p.id)
                const inTarget = tab === 'lineup' ? inLineup : inBench
                const lineupFull = lineup.length >= MAX_LINEUP && !inLineup

                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id, tab)}
                    disabled={tab === 'lineup' && lineupFull && !inLineup}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                      'text-left border',
                      inTarget
                        ? tab === 'lineup'
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                        : inLineup || inBench
                          ? 'bg-slate-700/40 border-slate-600/30 text-slate-400'
                          : 'bg-slate-800/40 border-slate-700/30 text-white hover:bg-slate-700/40',
                      'disabled:opacity-40'
                    )}
                  >
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/60 text-sm font-bold font-mono">
                      {p.number ?? '—'}
                    </span>
                    <span className="flex-1 font-medium text-sm">{p.name}</span>
                    <div className="flex gap-1.5">
                      {inLineup && <Badge color="emerald">Start</Badge>}
                      {inBench && <Badge color="violet">Bench</Badge>}
                      {!inLineup && !inBench && <Badge color="slate">—</Badge>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-500 text-center">
        Tap a player to add to the selected group
      </div>
    </div>
  )
}
