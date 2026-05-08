import { useState, useEffect } from 'react'
import { useRosterStore } from '../../../store/rosterStore'
import { BottomSheet } from './BottomSheet'
import { cn } from '../../../lib/utils'

// Player tile — large enough for a thumb, position-coloured accent bar
function PlayerTile({ player, onClick, dimmed = false }) {
  const posColor = { GK: 'bg-amber-500', DEF: 'bg-sky-500', MID: 'bg-emerald-500', FWD: 'bg-red-500' }[player.position] ?? 'bg-slate-500'

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl',
        'border border-slate-700/40 transition-all active:scale-[0.97]',
        dimmed
          ? 'bg-slate-800/30 text-slate-600'
          : 'bg-slate-800/60 hover:bg-slate-700/60 text-white',
      )}
    >
      {/* Position stripe */}
      <div className={cn('w-1 h-8 rounded-full shrink-0', posColor, dimmed && 'opacity-30')} />
      {/* Number */}
      <span className={cn('w-8 text-center font-black font-mono text-sm shrink-0', dimmed ? 'text-slate-600' : 'text-slate-300')}>
        {player.number ?? '?'}
      </span>
      {/* Name */}
      <span className={cn('flex-1 text-left font-semibold text-base', dimmed ? 'text-slate-600' : '')}>
        {player.name}
      </span>
      {/* Position badge */}
      <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-lg shrink-0', posColor, 'text-white/90', dimmed && 'opacity-30')}>
        {player.position}
      </span>
    </button>
  )
}

/**
 * Two-step goal sheet:
 *   Step 1 — pick scorer from squad
 *   Step 2 — pick assist provider (or tap "No assist")
 *
 * Saves automatically on step-2 selection.
 */
export function GoalSheet({ open, onClose, onSave, lineup = [] }) {
  const { players } = useRosterStore()
  const [scorer, setScorer] = useState(null)

  // Reset state whenever the sheet opens/closes
  useEffect(() => {
    if (!open) setScorer(null)
  }, [open])

  // Pool: prefer lineup players; fall back to full roster if lineup is empty
  const pool = lineup.length > 0
    ? players.filter(p => lineup.includes(p.id))
    : players

  // Forwards first (most likely scorers), then Mid → Def → GK
  const ORDER = ['FWD', 'MID', 'DEF', 'GK']
  const sorted = [...pool].sort((a, b) => ORDER.indexOf(a.position) - ORDER.indexOf(b.position))

  const handleScorerPick = (player) => setScorer(player)

  const handleAssistPick = (assistPlayer) => {
    onSave({ playerId: scorer.id, assistPlayerId: assistPlayer?.id ?? null })
    // parent will set open=false; useEffect above clears state
  }

  const step = scorer ? 'assist' : 'scorer'

  const title = step === 'scorer'
    ? '⚽ Who scored?'
    : `🎯 Assist for ${scorer.name.split(' ').pop()}?`

  return (
    <BottomSheet open={open} onClose={onClose} title={title} tall>
      <div className="px-3 pt-3 pb-8 space-y-1.5">
        {step === 'scorer' && sorted.map(p => (
          <PlayerTile key={p.id} player={p} onClick={() => handleScorerPick(p)} />
        ))}

        {step === 'assist' && (
          <>
            {/* No-assist option — prominent, first */}
            <button
              onClick={() => handleAssistPick(null)}
              className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-slate-700/50 border border-slate-600/60 text-slate-300 font-bold text-base active:scale-[0.97] transition-all hover:bg-slate-700"
            >
              <span className="text-lg">—</span>
              No assist
            </button>

            <div className="h-px bg-slate-800 my-1" />

            {/* Squad players (excluding scorer) */}
            {sorted.filter(p => p.id !== scorer.id).map(p => (
              <PlayerTile key={p.id} player={p} onClick={() => handleAssistPick(p)} />
            ))}
          </>
        )}
      </div>
    </BottomSheet>
  )
}
