import { useState, useEffect } from 'react'
import { useRosterStore } from '../../../store/rosterStore'
import { BottomSheet } from './BottomSheet'
import { GOAL_TYPES } from '../../../lib/constants'
import { cn } from '../../../lib/utils'

// ── Player tile ────────────────────────────────────────────────────────────

function PlayerTile({ player, onClick }) {
  const posColor = { GK: 'bg-amber-500', DEF: 'bg-sky-500', MID: 'bg-emerald-500', FWD: 'bg-red-500' }[player.position] ?? 'bg-slate-500'
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.97]',
        'bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40',
        'text-slate-900 dark:text-white',
      )}
    >
      <div className={cn('w-1 h-8 rounded-full shrink-0', posColor)} />
      <span className="w-8 text-center font-black font-mono text-sm shrink-0 text-slate-500 dark:text-slate-300">
        {player.number ?? '?'}
      </span>
      <span className="flex-1 text-left font-semibold text-base">{player.name}</span>
      <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-lg text-white shrink-0', posColor)}>
        {player.position}
      </span>
    </button>
  )
}

// ── Goal type grid ─────────────────────────────────────────────────────────

function GoalTypeGrid({ onPick }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {GOAL_TYPES.map(gt => (
        <button
          key={gt.value}
          onClick={() => onPick(gt.value)}
          className={cn(
            'min-h-[4.5rem] flex flex-col items-center justify-center gap-1 rounded-2xl',
            'border px-3 py-3 transition-all active:scale-95',
            'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/40',
            'text-slate-900 dark:text-white',
            'hover:bg-emerald-50 hover:border-emerald-300',
            'dark:hover:bg-emerald-500/10 dark:hover:border-emerald-500/40',
          )}
        >
          <span className="text-2xl">{gt.emoji}</span>
          <span className="text-sm font-bold">{gt.label}</span>
          <span className="text-[10px] text-slate-500">{gt.sub}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * Goal sheet — 3 steps for team goals, 1 step for goals against.
 *
 *   isTeamGoal=true  (GOAL):         scorer → assist → type → save
 *   isTeamGoal=false (GOAL_AGAINST): type only → save
 */
export function GoalSheet({ open, onClose, onSave, lineup = [], isTeamGoal = true }) {
  const { players } = useRosterStore()
  const [step,   setStep]   = useState(isTeamGoal ? 'scorer' : 'type')
  const [scorer, setScorer] = useState(null)
  const [assist, setAssist] = useState(undefined)  // undefined = not yet chosen

  useEffect(() => {
    if (!open) {
      setStep(isTeamGoal ? 'scorer' : 'type')
      setScorer(null)
      setAssist(undefined)
    }
  }, [open, isTeamGoal])

  const pool   = lineup.length > 0 ? players.filter(p => lineup.includes(p.id)) : players
  const ORDER  = ['FWD', 'MID', 'DEF', 'GK']
  const sorted = [...pool].sort((a, b) => ORDER.indexOf(a.position) - ORDER.indexOf(b.position))

  const handleScorerPick = (player) => { setScorer(player); setStep('assist') }
  const handleAssistPick = (player) => { setAssist(player ?? null); setStep('type') }
  const handleTypePick   = (goalType) => {
    onSave({
      ...(scorer              ? { playerId:     scorer.id       } : {}),
      ...(assist !== undefined ? { assistPlayerId: assist?.id ?? null } : {}),
      goalType,
    })
  }

  const titles = {
    scorer: '⚽ ¿Quién marcó?',
    assist: `🎯 ¿Asistencia para ${scorer?.name.split(' ').pop()}?`,
    type:   '📋 ¿Cómo fue el gol?',
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={titles[step]} tall>
      <div className="px-3 pt-3 pb-8 space-y-2">

        {step === 'scorer' && (
          sorted.map(p => <PlayerTile key={p.id} player={p} onClick={() => handleScorerPick(p)} />)
        )}

        {step === 'assist' && (
          <>
            <button
              onClick={() => handleAssistPick(null)}
              className={cn(
                'w-full h-14 flex items-center justify-center gap-2 rounded-2xl',
                'bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/60',
                'text-slate-600 dark:text-slate-300 font-bold text-base active:scale-[0.97] transition-all',
              )}
            >
              <span>—</span> Sin asistencia
            </button>
            <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
            {sorted.filter(p => p.id !== scorer?.id).map(p => (
              <PlayerTile key={p.id} player={p} onClick={() => handleAssistPick(p)} />
            ))}
          </>
        )}

        {step === 'type' && <GoalTypeGrid onPick={handleTypePick} />}
      </div>
    </BottomSheet>
  )
}
