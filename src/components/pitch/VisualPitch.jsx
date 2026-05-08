import { useState, useCallback } from 'react'
import {
  DndContext, DragOverlay,
  PointerSensor, TouchSensor,
  useSensor, useSensors,
  useDroppable, useDraggable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { PitchSVG } from './PitchSVG'
import { FORMATIONS, FORMATION_NAMES, PLAYER_STATUS } from '../../lib/constants'
import { cn } from '../../lib/utils'
import { useRosterStore } from '../../store/rosterStore'

const PITCH_H   = 65
const MAX_BENCH = 6
const POS_COLOR = { GK: 'bg-amber-500', DEF: 'bg-sky-500', MID: 'bg-emerald-500', FWD: 'bg-red-500' }

function isUnavailable(player) {
  const s = player?.status ?? 'available'
  return s === 'injured' || s === 'suspended' || s === 'absent'
}

// ── Pitch slot (droppable) ────────────────────────────────────────────────

function PositionSlot({ slot, player, onTap }) {
  const { setNodeRef, isOver } = useDroppable({ id: slot.id })
  const cssY = ((slot.y / PITCH_H) * 100).toFixed(1)
  const unavail = isUnavailable(player)

  return (
    <div
      ref={setNodeRef}
      onClick={onTap}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer touch-none"
      style={{ left: `${slot.x}%`, top: `${cssY}%` }}
    >
      <div className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center text-xs font-black',
        'border-2 transition-all duration-150 shadow-md',
        isOver
          ? 'scale-125 bg-amber-400 border-amber-200 text-slate-900'
          : player && unavail
            ? 'bg-red-500 border-red-300 text-white scale-105'
            : player
              ? 'bg-emerald-500 border-emerald-300 text-white scale-105'
              : 'bg-slate-900/80 border-white/40 text-white/60',
      )}>
        {player
          ? (player.number ?? '?')
          : <span className="text-[9px] leading-none">{slot.role}</span>
        }
      </div>
      {player && (
        <div className={cn(
          'mt-0.5 px-1 rounded text-[8px] font-semibold text-white leading-tight max-w-[3rem] text-center truncate',
          unavail ? 'bg-red-600/90' : 'bg-slate-900/80'
        )}>
          {unavail ? (PLAYER_STATUS[player.status]?.emoji ?? '⚠️') : player.name.split(' ')[0]}
        </div>
      )}
    </div>
  )
}

// ── Draggable chip (used in bench + descartados lists) ────────────────────

function DraggableChip({ player, suffix, onAction, actionLabel, actionColor = 'text-emerald-500 dark:text-emerald-400', disabled = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
    data: { player },
  })
  const posColor = POS_COLOR[player.position] ?? 'bg-slate-500'
  const unavail  = isUnavailable(player)
  const statusMeta = unavail ? PLAYER_STATUS[player.status ?? 'available'] : null

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={cn(
        'flex items-center gap-2 px-2.5 py-2 rounded-xl select-none touch-none',
        'border transition-all',
        unavail
          ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
          : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/40',
        isDragging ? 'opacity-30' : '',
      )}
      style={{ transform: CSS.Transform.toString(transform) }}
    >
      <div {...listeners} className="flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing">
        <div className={cn('w-1 h-7 rounded-full shrink-0', unavail ? 'bg-red-400' : posColor)} />
        <span className={cn('w-6 text-center font-black font-mono text-xs shrink-0', unavail ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-300')}>
          {player.number ?? '?'}
        </span>
        <span className={cn('text-xs font-medium truncate', unavail ? 'text-red-700 dark:text-red-300' : 'text-slate-900 dark:text-white')}>
          {player.name}
        </span>
      </div>
      {statusMeta && (
        <span className="text-sm shrink-0" title={statusMeta.label}>{statusMeta.emoji}</span>
      )}
      {onAction && (
        <button
          onClick={(e) => { e.stopPropagation(); onAction() }}
          disabled={disabled}
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded-full shrink-0',
            'text-base font-black transition-colors',
            disabled ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : `${actionColor} hover:bg-black/5 dark:hover:bg-white/10 active:scale-90`,
          )}
          title={actionLabel}
        >
          {suffix}
        </button>
      )}
    </div>
  )
}

// ── Drag overlay chip ─────────────────────────────────────────────────────

function FloatingChip({ player }) {
  if (!player) return null
  const unavail = isUnavailable(player)
  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-xl shadow-xl text-white text-sm font-bold',
      unavail ? 'bg-red-500 shadow-red-500/40' : 'bg-emerald-500 shadow-emerald-500/40'
    )}>
      <span className="font-mono font-black">{player.number ?? '?'}</span>
      {player.name}
      {unavail && <span className="text-sm">{PLAYER_STATUS[player.status]?.emoji}</span>}
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────

function SectionHeader({ title, count, max }) {
  const full = max !== undefined && count >= max
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</span>
      <span className={cn(
        'text-xs font-bold px-2 py-0.5 rounded-lg',
        full ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
      )}>
        {max !== undefined ? `${count}/${max}` : count}
        {full && ' · Max'}
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export function VisualPitch({
  formation,
  assignments,
  bench = [],
  onAssignmentsChange,
  onBenchChange,
  onFormationChange,
}) {
  const { players } = useRosterStore()
  const [dragPlayerId,  setDragPlayerId]  = useState(null)
  const [selectorSlot,  setSelectorSlot]  = useState(null)
  const [unavailBanner, setUnavailBanner] = useState(null)  // warning text after bad drag

  const slots = FORMATIONS[formation] ?? FORMATIONS['4-3-3']

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const getPlayer = useCallback((id) => players.find(p => p.id === id), [players])

  const assignedIds  = new Set(Object.values(assignments).filter(Boolean))
  const benchSet     = new Set(bench)
  const startingList = slots.map(s => assignments[s.id]).filter(Boolean)
  const benchList    = players.filter(p => benchSet.has(p.id))
  const descartados  = players.filter(p => !assignedIds.has(p.id) && !benchSet.has(p.id))

  const addToBench = useCallback((playerId) => {
    if (bench.length >= MAX_BENCH) return
    onBenchChange([...bench, playerId])
  }, [bench, onBenchChange])

  const removeFromBench = useCallback((playerId) => {
    onBenchChange(bench.filter(id => id !== playerId))
  }, [bench, onBenchChange])

  const handleDragStart = ({ active }) => setDragPlayerId(active.id)

  const handleDragEndSafe = useCallback((args) => {
    const { active, over } = args
    setDragPlayerId(null)
    const playerId = active.id
    const player   = getPlayer(playerId)

    const next = { ...assignments }
    for (const sid of Object.keys(next)) {
      if (next[sid] === playerId) delete next[sid]
    }

    if (over && !over.id.startsWith('__')) {
      next[over.id] = playerId
      if (benchSet.has(playerId)) onBenchChange(bench.filter(id => id !== playerId))

      if (player && isUnavailable(player)) {
        const meta = PLAYER_STATUS[player.status]
        setUnavailBanner(`${meta.emoji} ${player.name} está ${meta.label.toLowerCase()}`)
        setTimeout(() => setUnavailBanner(null), 3500)
      }
    }

    onAssignmentsChange(next)
  }, [assignments, bench, benchSet, getPlayer, onAssignmentsChange, onBenchChange])

  const handleSlotTap = (slot) => setSelectorSlot(slot)

  const handleQuickPick = (playerId) => {
    const next = { ...assignments }
    for (const sid of Object.keys(next)) {
      if (next[sid] === playerId) delete next[sid]
    }
    if (playerId && benchSet.has(playerId)) {
      onBenchChange(bench.filter(id => id !== playerId))
    }
    if (playerId) {
      next[selectorSlot.id] = playerId
      const player = getPlayer(playerId)
      if (player && isUnavailable(player)) {
        const meta = PLAYER_STATUS[player.status]
        setUnavailBanner(`${meta.emoji} ${player.name} está ${meta.label.toLowerCase()}`)
        setTimeout(() => setUnavailBanner(null), 3500)
      }
    } else {
      delete next[selectorSlot.id]
    }
    onAssignmentsChange(next)
    setSelectorSlot(null)
  }

  const changeFormation = (f) => {
    onFormationChange(f)
    onAssignmentsChange({})
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEndSafe}>

      {/* ── Formation pills ──────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {FORMATION_NAMES.map(f => (
          <button
            key={f}
            onClick={() => changeFormation(f)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
              formation === f ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Unavailability warning banner ────────────────────────────────── */}
      {unavailBanner && (
        <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
          <span className="flex-1">{unavailBanner} — confirma si quieres incluirlo de todas formas</span>
          <button onClick={() => setUnavailBanner(null)} className="text-amber-500 shrink-0">✕</button>
        </div>
      )}

      {/* ── Pitch ────────────────────────────────────────────────────────── */}
      <div
        className="relative w-full rounded-xl overflow-hidden bg-emerald-800"
        style={{ aspectRatio: '100 / 65' }}
      >
        <PitchSVG />
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[8px] text-white/40 font-bold uppercase tracking-widest pointer-events-none">
          Ataque ↑
        </div>
        {slots.map(slot => (
          <PositionSlot
            key={slot.id}
            slot={slot}
            player={assignments[slot.id] ? getPlayer(assignments[slot.id]) : null}
            onTap={() => handleSlotTap(slot)}
          />
        ))}
      </div>

      {/* ── Bench ────────────────────────────────────────────────────────── */}
      <div className="mt-4">
        <SectionHeader title="Banquillo" count={benchList.length} max={MAX_BENCH} />
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/30 rounded-xl p-2 min-h-[3rem]">
          {benchList.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">
              Toca <span className="text-emerald-600 dark:text-emerald-500 font-bold">+</span> en un jugador para añadirlo al banquillo
            </p>
          ) : (
            <div className="space-y-1">
              {benchList.map(p => (
                <DraggableChip
                  key={p.id}
                  player={p}
                  suffix="×"
                  actionLabel="Quitar del banquillo"
                  actionColor="text-red-500 dark:text-red-400"
                  onAction={() => removeFromBench(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Descartados ───────────────────────────────────────────────────── */}
      <div className="mt-4">
        <SectionHeader title="Descartados" count={descartados.length} />
        {descartados.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">Todos los jugadores asignados o en el banquillo</p>
        ) : (
          <div className="space-y-1">
            {descartados.map(p => (
              <DraggableChip
                key={p.id}
                player={p}
                suffix="+"
                actionLabel={bench.length >= MAX_BENCH ? 'Banquillo lleno (6/6)' : 'Añadir al banquillo'}
                actionColor="text-emerald-600 dark:text-emerald-400"
                onAction={() => addToBench(p.id)}
                disabled={bench.length >= MAX_BENCH}
              />
            ))}
          </div>
        )}
        <p className="text-[10px] text-slate-400 text-center mt-2">
          Arrastra al campo · Toca + para banquillo · Máx {MAX_BENCH} en el banquillo
        </p>
      </div>

      {/* ── Drag overlay ─────────────────────────────────────────────────── */}
      <DragOverlay dropAnimation={null}>
        <FloatingChip player={dragPlayerId ? getPlayer(dragPlayerId) : null} />
      </DragOverlay>

      {/* ── Tap-on-slot picker ───────────────────────────────────────────── */}
      {selectorSlot && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelectorSlot(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl px-4 pt-4 pb-8 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {selectorSlot.role} — {assignments[selectorSlot.id] ? 'Cambiar' : 'Asignar'} Jugador
              </h3>
              <button onClick={() => setSelectorSlot(null)} className="text-slate-400 text-lg w-8 h-8 flex items-center justify-center">✕</button>
            </div>

            <div className="max-h-72 overflow-y-auto no-scrollbar space-y-1">
              {assignments[selectorSlot.id] && (
                <button
                  onClick={() => handleQuickPick(null)}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold"
                >
                  ✕ Quitar del puesto
                </button>
              )}

              {benchList.length > 0 && (
                <>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 pb-1">Banquillo</div>
                  {benchList.map(p => (
                    <PlayerPickerRow key={p.id} player={p} isCurrent={assignments[selectorSlot.id] === p.id} badge="Banquillo" badgeColor="text-amber-600 dark:text-amber-400" onClick={() => handleQuickPick(p.id)} />
                  ))}
                </>
              )}

              {descartados.length > 0 && (
                <>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 pb-1">Descartados</div>
                  {descartados.map(p => (
                    <PlayerPickerRow key={p.id} player={p} isCurrent={assignments[selectorSlot.id] === p.id} badge="—" badgeColor="text-slate-400" onClick={() => handleQuickPick(p.id)} />
                  ))}
                </>
              )}

              {startingList.length > 0 && (
                <>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 pb-1">En el campo (cambio)</div>
                  {startingList
                    .filter(pid => pid !== assignments[selectorSlot.id])
                    .map(pid => {
                      const p = getPlayer(pid)
                      if (!p) return null
                      return <PlayerPickerRow key={pid} player={p} isCurrent={false} badge="Titular" badgeColor="text-emerald-600 dark:text-emerald-400" onClick={() => handleQuickPick(pid)} />
                    })
                  }
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DndContext>
  )
}

function PlayerPickerRow({ player, isCurrent, badge, badgeColor, onClick }) {
  const posColor = POS_COLOR[player.position] ?? 'bg-slate-500'
  const unavail  = isUnavailable(player)
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
        isCurrent
          ? 'bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
          : unavail
            ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300'
            : 'bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/60 text-slate-900 dark:text-white',
      )}
    >
      <div className={cn('w-1 h-6 rounded-full shrink-0', unavail ? 'bg-red-400' : posColor)} />
      <span className="w-7 text-center font-black font-mono text-xs text-slate-500 dark:text-slate-300 shrink-0">{player.number ?? '?'}</span>
      <span className="flex-1 text-left font-medium truncate">{player.name}</span>
      {unavail && <span className="text-sm shrink-0">{PLAYER_STATUS[player.status]?.emoji}</span>}
      <span className={cn('text-xs font-semibold shrink-0', badgeColor)}>{badge}</span>
    </button>
  )
}
