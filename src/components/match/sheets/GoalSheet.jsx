import { useState, useEffect } from 'react'
import { useRosterStore } from '../../../store/rosterStore'
import { BottomSheet } from './BottomSheet'
import { GOAL_TYPES } from '../../../lib/constants'
import { cn } from '../../../lib/utils'

// ── Shared helpers ─────────────────────────────────────────────────────────

const POS_ORDER_ATTACK = ['FWD', 'MID', 'DEF', 'GK']

function sortByPosition(list, order = POS_ORDER_ATTACK) {
  return [...list].sort((a, b) => order.indexOf(a.position) - order.indexOf(b.position))
}

// ── Player tile ────────────────────────────────────────────────────────────

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
      <span className="w-8 text-center font-black font-mono text-sm shrink-0 text-slate-500 dark:text-slate-300">
        {player.number ?? '?'}
      </span>
      <span className="flex-1 text-left font-semibold text-base text-slate-900 dark:text-white">{player.name}</span>
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

// ── Section divider ────────────────────────────────────────────────────────

function SectionLabel({ label }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

/**
 * Goal sheet — collects scorer, assist and goal type.
 *
 * Props:
 *   lineup      IDs currently on the pitch    (shown first, primary picks)
 *   bench       IDs on bench not yet used     (shown below, dimmed)
 *   isTeamGoal  true = GOAL flow, false = GOAL_AGAINST (type only)
 */
export function GoalSheet({ open, onClose, onSave, lineup = [], bench = [], isTeamGoal = true }) {
  const { players } = useRosterStore()
  const [step,   setStep]   = useState(isTeamGoal ? 'scorer' : 'type')
  const [scorer, setScorer] = useState(null)
  const [assist, setAssist] = useState(undefined)  // undefined = not chosen yet

  useEffect(() => {
    if (!open) {
      setStep(isTeamGoal ? 'scorer' : 'type')
      setScorer(null)
      setAssist(undefined)
    }
  }, [open, isTeamGoal])

  // Build sorted player pools
  const pitchPlayers = sortByPosition(
    lineup.length > 0 ? players.filter(p => lineup.includes(p.id)) : players
  )
  const benchPlayers = sortByPosition(
    bench.length > 0 ? players.filter(p => bench.includes(p.id) && !lineup.includes(p.id)) : []
  )
  // All candidates for assist (everyone except the scorer; bench included)
  const allForAssist = sortByPosition([...pitchPlayers, ...benchPlayers])

  const handleScorerPick = (player) => { setScorer(player); setStep('assist') }
  const handleAssistPick = (player) => { setAssist(player ?? null); setStep('type') }
  const handleTypePick   = (goalType) => {
    onSave({
      ...(scorer               ? { playerId:      scorer.id       } : {}),
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
      <div className="px-3 pt-3 pb-8 space-y-1.5">

        {/* ── Scorer picker ── */}
        {step === 'scorer' && (
          <>
            {pitchPlayers.length > 0 && (
              <>
                <SectionLabel label="En el campo" />
                {pitchPlayers.map(p => (
                  <PlayerTile key={p.id} player={p} onClick={() => handleScorerPick(p)} />
                ))}
              </>
            )}
            {benchPlayers.length > 0 && (
              <>
                <SectionLabel label="Banquillo" />
                {benchPlayers.map(p => (
                  <PlayerTile key={p.id} player={p} dimmed onClick={() => handleScorerPick(p)} />
                ))}
              </>
            )}
          </>
        )}

        {/* ── Assist picker ── */}
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
            {/* Show all for assists — anyone can assist */}
            {allForAssist.filter(p => p.id !== scorer?.id).map(p => (
              <PlayerTile
                key={p.id}
                player={p}
                dimmed={!lineup.includes(p.id)}
                onClick={() => handleAssistPick(p)}
              />
            ))}
          </>
        )}

        {/* ── Goal type ── */}
        {step === 'type' && <GoalTypeGrid onPick={handleTypePick} />}
      </div>
    </BottomSheet>
  )
}
