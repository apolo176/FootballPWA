import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatchEngine } from '../hooks/useMatchEngine'
import { useMatchStore } from '../store/matchStore'
import { useRosterStore } from '../store/rosterStore'
import { ScoreBoard } from '../components/match/ScoreBoard'
import { EventButton } from '../components/match/EventButton'
import { EventLog } from '../components/match/EventLog'
import { PlayerSelector } from '../components/match/PlayerSelector'
import { GoalSheet } from '../components/match/sheets/GoalSheet'
import { CardSheet } from '../components/match/sheets/CardSheet'
import { Button } from '../components/ui/Button'
import { EVENT, PHASE } from '../lib/constants'

// ── Button layout ────────────────────────────────────────────────────────────

const PRIMARY_ACTIONS = [
  { type: EVENT.GOAL,         emoji: '⚽', label: 'Goal',    color: 'emerald', flow: 'goal'         },
  { type: EVENT.GOAL_AGAINST, emoji: '😓', label: 'Contra',  color: 'red',     flow: 'goal_against' },
]

const SECONDARY_ACTIONS = [
  { type: EVENT.SHOT_ON,  emoji: '🎯', label: 'On Target',   color: 'sky',    flow: 'player'  },
  { type: EVENT.SHOT_OFF, emoji: '↗️', label: 'Off Target',  color: 'slate',  flow: 'player'  },
  { type: EVENT.DANGER,   emoji: '⚡', label: 'Peligro',     color: 'amber',  flow: 'player'  },
  { type: EVENT.SAVE,     emoji: '🧤', label: 'Parada',      color: 'sky',    flow: 'gksave'  },
  { type: EVENT.BIG_SAVE, emoji: '🦁', label: 'Gran Parada', color: 'violet', flow: 'gksave'  },
  { type: EVENT.YELLOW,   emoji: '🟨', label: 'Amarilla',    color: 'yellow', flow: 'card'    },
  { type: EVENT.RED,      emoji: '🟥', label: 'Roja',        color: 'red',    flow: 'card'    },
  { type: EVENT.SUB,      emoji: '🔄', label: 'Cambio',      color: 'violet', flow: 'sub'     },
  { type: EVENT.OWN_GOAL, emoji: '🙈', label: 'P. Propia',   color: 'amber',  flow: 'player'  },
]

export default function LiveMatch() {
  const navigate   = useNavigate()
  const { players: allPlayers } = useRosterStore()
  const { activeMatch } = useMatchStore()

  // useMatchEngine is the canonical source for timer + on-pitch tracking
  const {
    match, elapsed, isLive, isTimerRunning,
    activePlayers, availableBench,
    kickOff, pauseResume, recordEvent, removeEvent,
    handleEndHalf, handleSecondHalf, handleFinish,
  } = useMatchEngine()

  // ── Modal / sheet state ──────────────────────────────────────────────────
  const [goalSheetOpen,        setGoalSheetOpen]        = useState(false)
  const [goalAgainstSheetOpen, setGoalAgainstSheetOpen] = useState(false)
  const [cardSheetOpen,        setCardSheetOpen]        = useState(false)
  const [cardType,             setCardType]             = useState(null)
  const [selectorOpen,         setSelectorOpen]         = useState(false)
  const [pending,              setPending]              = useState(null)
  const [subMode,              setSubMode]              = useState(false)
  const [subOutPlayer,         setSubOutPlayer]         = useState(null)

  // ── Dispatch ─────────────────────────────────────────────────────────────

  const handleActionPress = useCallback((action) => {
    if (!isLive) return
    switch (action.flow) {
      case 'goal':         setGoalSheetOpen(true);                                  break
      case 'goal_against': setGoalAgainstSheetOpen(true);                           break
      case 'card':         setCardType(action.type); setCardSheetOpen(true);        break
      case 'gksave':       handleGkSave(action.type);                               break
      case 'sub':          setPending(action); setSubMode(false); setSelectorOpen(true); break
      default:             setPending(action); setSelectorOpen(true);                break
    }
  }, [isLive]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── GK save: auto-select if only 1 GK on pitch ──────────────────────────
  const handleGkSave = useCallback((type) => {
    const gks = activePlayers
      .map(id => allPlayers.find(p => p.id === id))
      .filter(p => p?.position === 'GK')
    if (gks.length === 1) {
      recordEvent(type, { playerId: gks[0].id })
    } else {
      setPending({ type, flow: 'player', label: type === EVENT.SAVE ? 'Parada' : 'Gran Parada' })
      setSelectorOpen(true)
    }
  }, [activePlayers, allPlayers, recordEvent])

  // ── Goal (our team) ──────────────────────────────────────────────────────
  const handleGoalSave = useCallback(({ playerId, assistPlayerId, goalType }) => {
    recordEvent(EVENT.GOAL, { playerId, assistPlayerId, goalType })
    setGoalSheetOpen(false)
  }, [recordEvent])

  // ── Goal against ─────────────────────────────────────────────────────────
  const handleGoalAgainstSave = useCallback(({ goalType }) => {
    recordEvent(EVENT.GOAL_AGAINST, { goalType })
    setGoalAgainstSheetOpen(false)
  }, [recordEvent])

  // ── Card ─────────────────────────────────────────────────────────────────
  const handleCardSave = useCallback(({ playerId, reason }) => {
    recordEvent(cardType, { playerId, reason })
    setCardSheetOpen(false)
    setCardType(null)
  }, [cardType, recordEvent])

  // ── Generic player selector (shots, danger, own goal, sub) ───────────────
  const handlePlayerSelected = useCallback((player) => {
    if (!pending) return
    if (pending.flow === 'sub') {
      if (!subMode) { setSubOutPlayer(player); setSubMode(true); return }
      recordEvent(EVENT.SUB, { playerId: subOutPlayer.id, subPlayerId: player.id })
      setSelectorOpen(false); setPending(null); setSubOutPlayer(null); setSubMode(false)
      return
    }
    recordEvent(pending.type, { playerId: player.id })
    setSelectorOpen(false); setPending(null)
  }, [pending, subMode, subOutPlayer, recordEvent])

  const handleSelectorClose = () => {
    setSelectorOpen(false); setPending(null); setSubOutPlayer(null); setSubMode(false)
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!activeMatch) {
    return (
      <div className="page-container flex flex-col items-center justify-center gap-6 text-center px-8">
        <div className="text-6xl">⚽</div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hay partido en curso</h2>
          <p className="text-slate-500 text-sm">Configura un partido para empezar.</p>
        </div>
        <Button size="lg" onClick={() => navigate('/setup')}>Configurar Partido</Button>
      </div>
    )
  }

  const isPreMatch  = activeMatch.phase === PHASE.PRE
  const isPostMatch = activeMatch.phase === PHASE.POST

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      <ScoreBoard
        match={activeMatch}
        elapsed={elapsed}
        isTimerRunning={isTimerRunning}
        onPauseResume={pauseResume}
        onEndHalf={handleEndHalf}
        onSecondHalf={handleSecondHalf}
        onFinish={handleFinish}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-28 bg-slate-50 dark:bg-slate-950">

        {/* PRE-MATCH */}
        {isPreMatch && (
          <div className="flex flex-col items-center justify-center gap-6 py-16 px-6 text-center animate-fade-in">
            <div className="text-6xl">🚀</div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">¡Listos para empezar!</h2>
              <p className="text-slate-500 text-sm mt-1">
                vs <span className="font-bold text-slate-800 dark:text-white">{activeMatch.opponent}</span>
              </p>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">{activeMatch.formation}</p>
            </div>
            <Button size="xl" className="w-full max-w-xs" onClick={kickOff}>▶ Comenzar Partido</Button>
          </div>
        )}

        {/* POST-MATCH */}
        {isPostMatch && (
          <div className="px-4 pt-4 space-y-4 animate-fade-in">
            <div className="text-center py-6 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/30">
              <div className="text-4xl mb-2">🏁</div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Partido Terminado</h2>
              <p className="text-slate-500 text-sm mt-1">vs {activeMatch.opponent}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" className="flex-1" onClick={() => navigate('/stats')}>Ver Estadísticas</Button>
              <Button variant="outline" size="lg" className="flex-1" onClick={() => navigate('/setup')}>Nuevo Partido</Button>
            </div>
            <EventLog events={activeMatch.events} onRemove={removeEvent} />
          </div>
        )}

        {/* LIVE TRACKER */}
        {isLive && (
          <div className="px-3 pt-4 space-y-4 animate-fade-in">

            {/* Primary — XXL */}
            <div className="grid grid-cols-2 gap-3">
              {PRIMARY_ACTIONS.map(a => (
                <EventButton key={a.type} emoji={a.emoji} label={a.label} color={a.color} size="xl"
                  onClick={() => handleActionPress(a)} />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/50" />
              <span className="text-xs text-slate-400 dark:text-slate-600 uppercase tracking-widest font-semibold">Más</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/50" />
            </div>

            {/* Secondary — 3-column */}
            <div className="grid grid-cols-3 gap-2">
              {SECONDARY_ACTIONS.map(a => (
                <EventButton key={a.type} emoji={a.emoji} label={a.label} color={a.color} size="md"
                  onClick={() => handleActionPress(a)} />
              ))}
            </div>

            {/* Event log */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Registro</h3>
                <span className="text-xs text-slate-400 dark:text-slate-600">
                  {activeMatch.events.filter(e => !['match_start','half_time','second_half','match_end'].includes(e.type)).length} eventos
                </span>
              </div>
              <EventLog events={activeMatch.events} onRemove={removeEvent} compact />
            </div>
          </div>
        )}
      </div>

      {/* ── Sheets ────────────────────────────────────────────────────────── */}

      {/* Goal (our team) — scorer + assist + type */}
      <GoalSheet
        open={goalSheetOpen}
        onClose={() => setGoalSheetOpen(false)}
        onSave={handleGoalSave}
        lineup={activePlayers}
        bench={availableBench}
        isTeamGoal
      />

      {/* Goal against — type only */}
      <GoalSheet
        open={goalAgainstSheetOpen}
        onClose={() => setGoalAgainstSheetOpen(false)}
        onSave={handleGoalAgainstSave}
        lineup={[]}
        bench={[]}
        isTeamGoal={false}
      />

      {/* Card — on-pitch + bench always available */}
      <CardSheet
        open={cardSheetOpen}
        onClose={() => { setCardSheetOpen(false); setCardType(null) }}
        onSave={handleCardSave}
        lineup={activePlayers}
        bench={availableBench}
        cardType={cardType}
      />

      {/* Generic player selector (shots, danger, own goal, sub) */}
      <PlayerSelector
        open={selectorOpen}
        onClose={handleSelectorClose}
        onSelect={handlePlayerSelected}
        lineup={pending?.flow === 'sub' && subMode ? availableBench : activePlayers}
        title={
          pending?.flow === 'sub'
            ? subMode ? `Entra → reemplaza a ${subOutPlayer?.name}` : 'Sale del campo'
            : `${pending?.label ?? 'Seleccionar'}: Jugador`
        }
      />
    </div>
  )
}
