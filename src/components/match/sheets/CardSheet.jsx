import { useState, useEffect } from 'react'
import { useRosterStore } from '../../../store/rosterStore'
import { BottomSheet } from './BottomSheet'
import { YELLOW_REASONS, RED_REASONS, EVENT } from '../../../lib/constants'
import { cn } from '../../../lib/utils'

// Reuse the same player tile from GoalSheet but inline to keep each file self-contained
function PlayerTile({ player, onClick }) {
  const posColor = { GK: 'bg-amber-500', DEF: 'bg-sky-500', MID: 'bg-emerald-500', FWD: 'bg-red-500' }[player.position] ?? 'bg-slate-500'

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 text-white transition-all active:scale-[0.97]"
    >
      <div className={cn('w-1 h-8 rounded-full shrink-0', posColor)} />
      <span className="w-8 text-center font-black font-mono text-sm shrink-0 text-slate-300">{player.number ?? '?'}</span>
      <span className="flex-1 text-left font-semibold text-base">{player.name}</span>
      <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-lg shrink-0 text-white/90', posColor)}>{player.position}</span>
    </button>
  )
}

/**
 * Two-step card sheet:
 *   Step 1 — pick player who received the card
 *   Step 2 — pick reason from a fat-finger-friendly grid
 *
 * Saves automatically on reason selection.
 */
export function CardSheet({ open, onClose, onSave, lineup = [], cardType }) {
  const { players } = useRosterStore()
  const [player, setPlayer] = useState(null)

  useEffect(() => {
    if (!open) setPlayer(null)
  }, [open])

  const isYellow = cardType === EVENT.YELLOW
  const reasons  = isYellow ? YELLOW_REASONS : RED_REASONS

  const pool = lineup.length > 0 ? players.filter(p => lineup.includes(p.id)) : players
  const ORDER = ['DEF', 'MID', 'FWD', 'GK']
  const sorted = [...pool].sort((a, b) => ORDER.indexOf(a.position) - ORDER.indexOf(b.position))

  const handlePlayerPick = (p) => setPlayer(p)

  const handleReasonPick = (reason) => {
    onSave({ playerId: player.id, reason })
  }

  const step = player ? 'reason' : 'player'

  const cardEmoji  = isYellow ? '🟨' : '🟥'
  const cardLabel  = isYellow ? 'Yellow Card' : 'Red Card'
  const accentRing = isYellow ? 'ring-yellow-400/40' : 'ring-red-400/40'
  const accentBg   = isYellow ? 'bg-yellow-400/10 border-yellow-400/30 hover:bg-yellow-400/20 text-yellow-100' : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-200'

  const title = step === 'player'
    ? `${cardEmoji} ${cardLabel} — Who?`
    : `${cardEmoji} Reason — ${player.name.split(' ').pop()}`

  return (
    <BottomSheet open={open} onClose={onClose} title={title} tall>
      <div className="px-3 pt-3 pb-8 space-y-1.5">

        {/* Step 1: Player selection */}
        {step === 'player' && sorted.map(p => (
          <PlayerTile key={p.id} player={p} onClick={() => handlePlayerPick(p)} />
        ))}

        {/* Step 2: Reason grid */}
        {step === 'reason' && (
          <>
            {/* Selected player recap */}
            <div className={cn('flex items-center gap-3 px-4 py-3 rounded-2xl mb-3 ring-1', accentRing,
              isYellow ? 'bg-yellow-400/10' : 'bg-red-500/10'
            )}>
              <span className="text-xl">{cardEmoji}</span>
              <div>
                <div className="font-bold text-white text-sm">{player.name}</div>
                <div className="text-xs text-slate-400">{player.position} · #{player.number}</div>
              </div>
              <button
                onClick={() => setPlayer(null)}
                className="ml-auto text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                Change
              </button>
            </div>

            <p className="text-xs text-slate-500 px-1 mb-2">Select reason</p>

            {/* Reason buttons — 2-column grid, large tap targets */}
            <div className="grid grid-cols-2 gap-2">
              {reasons.map(reason => (
                <button
                  key={reason}
                  onClick={() => handleReasonPick(reason)}
                  className={cn(
                    'min-h-[4rem] px-3 py-3 rounded-2xl border text-sm font-semibold',
                    'text-center leading-tight transition-all active:scale-95',
                    accentBg
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
