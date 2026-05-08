import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatchEngine } from '../hooks/useMatchEngine'
import { useMatchStore } from '../store/matchStore'
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
  { type: EVENT.GOAL,         emoji: '⚽', label: 'Goal',    color: 'emerald', flow: 'goal'    },
  { type: EVENT.GOAL_AGAINST, emoji: '😓', label: 'Against', color: 'red',     flow: 'instant' },
]

const SECONDARY_ACTIONS = [
  { type: EVENT.SHOT_ON,  emoji: '🎯', label: 'On Target',  color: 'sky',    flow: 'player'  },
  { type: EVENT.SHOT_OFF, emoji: '↗️', label: 'Off Target', color: 'slate',  flow: 'player'  },
  { type: EVENT.DANGER,   emoji: '⚡', label: 'Danger',     color: 'amber',  flow: 'player'  },
  { type: EVENT.YELLOW,   emoji: '🟨', label: 'Yellow',     color: 'yellow', flow: 'card'    },
  { type: EVENT.RED,      emoji: '🟥', label: 'Red Card',   color: 'red',    flow: 'card'    },
  { type: EVENT.SUB,      emoji: '🔄', label: 'Sub',        color: 'violet', flow: 'sub'     },
  { type: EVENT.OWN_GOAL, emoji: '🙈', label: 'Own Goal',   color: 'amber',  flow: 'player'  },
]

// flow types:
//   'instant' — no picker, log immediately
//   'goal'    — GoalSheet (scorer + optional assist)
//   'card'    — CardSheet (player + reason)
//   'player'  — generic PlayerSelector
//   'sub'     — two-step PlayerSelector (out → in)

export default function LiveMatch() {
  const navigate = useNavigate()
  const { match, elapsed, isLive, isTimerRunning, kickOff, pauseResume,
          recordEvent, removeEvent, handleEndHalf, handleSecondHalf, handleFinish } = useMatchEngine()
  const { activeMatch } = useMatchStore()

  // ── Sheet / modal state ──────────────────────────────────────────────────
  const [goalSheetOpen, setGoalSheetOpen] = useState(false)
  const [cardSheetOpen, setCardSheetOpen] = useState(false)
  const [cardType,      setCardType]      = useState(null)    // EVENT.YELLOW | EVENT.RED
  const [selectorOpen,  setSelectorOpen]  = useState(false)
  const [pending,       setPending]       = useState(null)    // for generic player events
  const [subMode,       setSubMode]       = useState(false)
  const [subOutPlayer,  setSubOutPlayer]  = useState(null)

  // ── Dispatch action to correct flow ─────────────────────────────────────

  const handleActionPress = useCallback((action) => {
    if (!isLive) return

    switch (action.flow) {
      case 'instant':
        recordEvent(action.type)
        break

      case 'goal':
        setGoalSheetOpen(true)
        break

      case 'card':
        setCardType(action.type)
        setCardSheetOpen(true)
        break

      case 'sub':
        setPending(action)
        setSubMode(false)
        setSelectorOpen(true)
        break

      case 'player':
      default:
        setPending(action)
        setSelectorOpen(true)
        break
    }
  }, [isLive, recordEvent])

  // ── Goal sheet save ──────────────────────────────────────────────────────

  const handleGoalSave = useCallback(({ playerId, assistPlayerId }) => {
    recordEvent(EVENT.GOAL, { playerId, assistPlayerId })
    setGoalSheetOpen(false)
  }, [recordEvent])

  // ── Card sheet save ──────────────────────────────────────────────────────

  const handleCardSave = useCallback(({ playerId, reason }) => {
    recordEvent(cardType, { playerId, reason })
    setCardSheetOpen(false)
    setCardType(null)
  }, [cardType, recordEvent])

  // ── Generic player selector ──────────────────────────────────────────────

  const handlePlayerSelected = useCallback((player) => {
    if (!pending) return

    if (pending.flow === 'sub') {
      if (!subMode) {
        setSubOutPlayer(player)
        setSubMode(true)
        return   // keep selector open for second pick
      }
      recordEvent(EVENT.SUB, { playerId: subOutPlayer.id, subPlayerId: player.id })
      setSelectorOpen(false)
      setPending(null)
      setSubOutPlayer(null)
      setSubMode(false)
      return
    }

    recordEvent(pending.type, { playerId: player.id })
    setSelectorOpen(false)
    setPending(null)
  }, [pending, subMode, subOutPlayer, recordEvent])

  const handleSelectorClose = () => {
    setSelectorOpen(false)
    setPending(null)
    setSubOutPlayer(null)
    setSubMode(false)
  }

  // ── Empty state ──────────────────────────────────────────────────────────

  if (!activeMatch) {
    return (
      <div className="page-container flex flex-col items-center justify-center gap-6 text-center px-8">
        <div className="text-6xl">⚽</div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">No match in progress</h2>
          <p className="text-slate-400 text-sm">Set up a new match to start tracking.</p>
        </div>
        <Button size="lg" onClick={() => navigate('/setup')}>Set Up Match</Button>
      </div>
    )
  }

  const isPreMatch  = activeMatch.phase === PHASE.PRE
  const isPostMatch = activeMatch.phase === PHASE.POST

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* Sticky scoreboard */}
      <ScoreBoard
        match={activeMatch}
        elapsed={elapsed}
        isTimerRunning={isTimerRunning}
        onPauseResume={pauseResume}
        onEndHalf={handleEndHalf}
        onSecondHalf={handleSecondHalf}
        onFinish={handleFinish}
      />

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-28">

        {/* PRE-MATCH */}
        {isPreMatch && (
          <div className="flex flex-col items-center justify-center gap-6 py-16 px-6 text-center animate-fade-in">
            <div className="text-6xl">🚀</div>
            <div>
              <h2 className="text-2xl font-black text-white">Ready to kick off!</h2>
              <p className="text-slate-400 text-sm mt-1">
                vs <span className="font-bold text-white">{activeMatch.opponent}</span>
              </p>
              <p className="text-emerald-400 text-sm mt-0.5">{activeMatch.formation}</p>
            </div>
            <Button size="xl" className="w-full max-w-xs" onClick={kickOff}>▶ Start Match</Button>
          </div>
        )}

        {/* POST-MATCH */}
        {isPostMatch && (
          <div className="px-4 pt-4 space-y-4 animate-fade-in">
            <div className="text-center py-6 bg-slate-800/40 rounded-2xl border border-slate-700/30">
              <div className="text-4xl mb-2">🏁</div>
              <h2 className="text-xl font-black text-white">Full Time</h2>
              <p className="text-slate-400 text-sm mt-1">vs {activeMatch.opponent}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" className="flex-1" onClick={() => navigate('/stats')}>
                View Stats
              </Button>
              <Button variant="outline" size="lg" className="flex-1" onClick={() => navigate('/setup')}>
                New Match
              </Button>
            </div>
            <EventLog events={activeMatch.events} onRemove={removeEvent} />
          </div>
        )}

        {/* LIVE TRACKER */}
        {isLive && (
          <div className="px-3 pt-4 space-y-4 animate-fade-in">

            {/* Primary — XXL, two-column */}
            <div className="grid grid-cols-2 gap-3">
              {PRIMARY_ACTIONS.map(action => (
                <EventButton
                  key={action.type}
                  emoji={action.emoji}
                  label={action.label}
                  color={action.color}
                  size="xl"
                  onClick={() => handleActionPress(action)}
                />
              ))}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-700/50" />
              <span className="text-xs text-slate-600 uppercase tracking-widest font-semibold">More Events</span>
              <div className="flex-1 h-px bg-slate-700/50" />
            </div>

            {/* Secondary — 3-column */}
            <div className="grid grid-cols-3 gap-2">
              {SECONDARY_ACTIONS.map(action => (
                <EventButton
                  key={action.type}
                  emoji={action.emoji}
                  label={action.label}
                  color={action.color}
                  size="md"
                  onClick={() => handleActionPress(action)}
                />
              ))}
            </div>

            {/* Recent events */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Match Log</h3>
                <span className="text-xs text-slate-600">
                  {activeMatch.events.filter(e =>
                    !['match_start','half_time','second_half','match_end'].includes(e.type)
                  ).length} events
                </span>
              </div>
              <EventLog events={activeMatch.events} onRemove={removeEvent} compact />
            </div>
          </div>
        )}
      </div>

      {/* ── Goal sheet ─────────────────────────────────────────────────── */}
      <GoalSheet
        open={goalSheetOpen}
        onClose={() => setGoalSheetOpen(false)}
        onSave={handleGoalSave}
        lineup={activeMatch.lineup}
      />

      {/* ── Card sheet ─────────────────────────────────────────────────── */}
      <CardSheet
        open={cardSheetOpen}
        onClose={() => { setCardSheetOpen(false); setCardType(null) }}
        onSave={handleCardSave}
        lineup={activeMatch.lineup}
        cardType={cardType}
      />

      {/* ── Generic player selector (shots, danger, sub, own goal) ─────── */}
      <PlayerSelector
        open={selectorOpen}
        onClose={handleSelectorClose}
        onSelect={handlePlayerSelected}
        lineup={pending?.flow === 'sub' && subMode ? activeMatch.bench : activeMatch.lineup}
        title={
          pending?.flow === 'sub'
            ? subMode ? `Coming In → replacing ${subOutPlayer?.name}` : 'Player Coming Off'
            : `${pending?.label ?? 'Select'}: Choose Player`
        }
      />
    </div>
  )
}
