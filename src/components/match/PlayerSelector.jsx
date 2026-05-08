import { useState, useEffect } from 'react'
import { useRosterStore } from '../../store/rosterStore'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'

export function PlayerSelector({ open, onClose, onSelect, title = 'Select Player', lineup = [], playerIds }) {
  const { players } = useRosterStore()
  const [search, setSearch] = useState('')

  // Reset search whenever the modal opens/closes
  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  // Build the candidate pool:
  // 1. If explicit playerIds list → use that
  // 2. If lineup has entries → filter to those players
  // 3. If lineup is empty (setup skipped) → show everyone so the app isn't dead
  const pool = playerIds
    ? players.filter(p => playerIds.includes(p.id))
    : lineup.length > 0
      ? players.filter(p => lineup.includes(p.id))
      : players  // fallback: all players

  const filtered = search
    ? pool.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        String(p.number).includes(search)
      )
    : pool

  const grouped = ['GK', 'DEF', 'MID', 'FWD']
    .map(pos => ({ pos, players: filtered.filter(p => p.position === pos) }))
    .filter(g => g.players.length > 0)

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search by name or number…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          autoFocus
        />

        {lineup.length === 0 && !playerIds && (
          <p className="text-xs text-amber-400/80 bg-amber-500/10 rounded-lg px-3 py-2">
            No lineup set — showing all squad players
          </p>
        )}

        <div className="max-h-72 overflow-y-auto space-y-3 no-scrollbar">
          {grouped.length === 0 ? (
            <p className="text-center text-slate-500 py-6 text-sm">No players found</p>
          ) : (
            grouped.map(({ pos, players: grpPlayers }) => (
              <div key={pos}>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-1">{pos}</div>
                <div className="space-y-1">
                  {grpPlayers.map(p => (
                    <button
                      key={p.id}
                      // Only call onSelect — the PARENT decides whether to close.
                      // Do NOT call onClose() here; that would wipe pending/subOutPlayer
                      // and break the two-step substitution flow.
                      onClick={() => onSelect(p)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
                        'bg-slate-800/60 hover:bg-slate-700/60 active:bg-slate-700',
                        'text-white text-left transition-colors active:scale-[0.98]'
                      )}
                    >
                      <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 text-sm font-bold font-mono shrink-0">
                        {p.number ?? '—'}
                      </span>
                      <span className="flex-1 font-medium truncate">{p.name}</span>
                      <Badge color={pos}>{pos}</Badge>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
