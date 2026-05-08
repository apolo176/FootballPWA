import { useState, useEffect } from 'react'
import { useRosterStore } from '../../../store/rosterStore'
import { BottomSheet } from './BottomSheet'
import { YELLOW_REASONS, RED_REASONS, EVENT } from '../../../lib/constants'
import { cn } from '../../../lib/utils'

function PlayerTile({ player, onClick, dimmed = false }) {
  const posColor = { GK: 'bg-amber-500', DEF: 'bg-sky-500', MID: 'bg-emerald-500', FWD: 'bg-red-500' }[player.position] ?? 'bg-slate-500'
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.97]',
        'border border-slate-200 dark:border-slate-700/40',
        dimmed
          ? 'bg-slate-50 dark:bg-slate-800/30 opacity-70'
          : 'bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white',
      )}
    >
      <div className={cn('w-1 h-8 rounded-full shrink-0', posColor)} />
      <span className="w-8 text-center font-black font-mono text-sm shrink-0 text-slate-500 dark:text-slate-300">{player.number ?? '?'}</span>
      <span className="flex-1 text-left font-semibold text-base text-slate-900 dark:text-white">{player.name}</span>
      <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-lg text-white shrink-0', posColor)}>{player.position}</span>
    </button>
  )
}

function SectionLabel({ label }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
    </div>
  )
}

/**
 * Card sheet — pick recipient then reason.
 *
 * Props:
 *   lineup    IDs currently on the pitch   (primary pool)
 *   bench     IDs on bench not yet used    (secondary pool — bench players
 *              CAN be carded for misconduct from the technical area)
 */
export function CardSheet({ open, onClose, onSave, lineup = [], bench = [], cardType }) {
  const { players } = useRosterStore()
  const [player, setPlayer] = useState(null)

  useEffect(() => { if (!open) setPlayer(null) }, [open])

  const isYellow = cardType === EVENT.YELLOW
  const reasons  = isYellow ? YELLOW_REASONS : RED_REASONS

  const ORDER = ['DEF', 'MID', 'FWD', 'GK']
  const sort  = (list) => [...list].sort((a, b) => ORDER.indexOf(a.position) - ORDER.indexOf(b.position))

  // On-pitch always shown; bench always available (warming-up players can be carded)
  const pitchPool = sort(lineup.length > 0 ? players.filter(p => lineup.includes(p.id)) : players)
  const benchPool = sort(bench.length > 0
    ? players.filter(p => bench.includes(p.id) && !lineup.includes(p.id))
    : []
  )

  const cardEmoji  = isYellow ? '🟨' : '🟥'
  const step       = player ? 'reason' : 'player'
  const title      = step === 'player'
    ? `${cardEmoji} ¿A quién?`
    : `${cardEmoji} Motivo — ${player.name.split(' ').pop()}`

  const accentRing = isYellow ? 'ring-yellow-400/40' : 'ring-red-400/40'
  const reasonBg   = isYellow
    ? 'bg-yellow-50 dark:bg-yellow-400/10 border-yellow-300 dark:border-yellow-400/30 hover:bg-yellow-100 dark:hover:bg-yellow-400/20 text-yellow-900 dark:text-yellow-100'
    : 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-900 dark:text-red-200'

  return (
    <BottomSheet open={open} onClose={onClose} title={title} tall>
      <div className="px-3 pt-3 pb-8 space-y-1.5">

        {/* ── Player picker ── */}
        {step === 'player' && (
          <>
            {pitchPool.length > 0 && (
              <>
                <SectionLabel label="En el campo" />
                {pitchPool.map(p => (
                  <PlayerTile key={p.id} player={p} onClick={() => setPlayer(p)} />
                ))}
              </>
            )}
            {benchPool.length > 0 && (
              <>
                <SectionLabel label="Banquillo" />
                {benchPool.map(p => (
                  <PlayerTile key={p.id} player={p} dimmed onClick={() => setPlayer(p)} />
                ))}
              </>
            )}
          </>
        )}

        {/* ── Reason picker ── */}
        {step === 'reason' && (
          <>
            <div className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-2xl mb-3 ring-1',
              accentRing,
              isYellow ? 'bg-yellow-50 dark:bg-yellow-400/10' : 'bg-red-50 dark:bg-red-500/10',
            )}>
              <span className="text-xl">{cardEmoji}</span>
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">{player.name}</div>
                <div className="text-xs text-slate-500">{player.position} · #{player.number}</div>
              </div>
              <button onClick={() => setPlayer(null)} className="ml-auto text-slate-400 hover:text-slate-600 text-sm transition-colors">
                Cambiar
              </button>
            </div>

            <p className="text-xs text-slate-500 px-1 mb-2">Selecciona el motivo</p>

            <div className="grid grid-cols-2 gap-2">
              {reasons.map(reason => (
                <button
                  key={reason}
                  onClick={() => onSave({ playerId: player.id, reason })}
                  className={cn(
                    'min-h-[4rem] px-3 py-3 rounded-2xl border text-sm font-semibold',
                    'text-center leading-tight transition-all active:scale-95',
                    reasonBg,
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
