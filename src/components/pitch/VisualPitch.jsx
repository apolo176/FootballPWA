import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { PitchSVG } from './PitchSVG'
import { FORMATIONS, FORMATION_NAMES } from '../../lib/constants'
import { cn } from '../../lib/utils'
import { useRosterStore } from '../../store/rosterStore'

const PITCH_H = 65  // SVG viewBox height — used to convert y → CSS %

// ── Slot: a droppable position on the pitch ────────────────────────────────

function PositionSlot({ slot, player, onTap }) {
  const { setNodeRef, isOver } = useDroppable({ id: slot.id })

  const cssY = ((slot.y / PITCH_H) * 100).toFixed(1)

  return (
    <div
      ref={setNodeRef}
      onClick={onTap}
      className={cn(
        'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center',
        'cursor-pointer touch-none'
      )}
      style={{ left: `${slot.x}%`, top: `${cssY}%` }}
    >
      <div className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center text-xs font-black',
        'border-2 transition-all duration-150 shadow-md',
        isOver
          ? 'scale-125 bg-amber-400 border-amber-200 text-slate-900'
          : player
            ? 'bg-emerald-500 border-emerald-300 text-white scale-105'
            : 'bg-slate-900/80 border-white/40 text-white/60',
      )}>
        {player ? (player.number ?? '?') : <span className="text-[9px] leading-none">{slot.role}</span>}
      </div>
      {player && (
        <div className="mt-0.5 px-1 py-0 bg-slate-900/80 rounded text-[8px] font-semibold text-white leading-tight max-w-12 text-center truncate">
          {player.name.split(' ')[0]}
        </div>
      )}
    </div>
  )
}

// ── Bench pool: droppable "remove from pitch" zone ───────────────────────

function BenchPool({ children }) {
  const { setNodeRef, isOver } = useDroppable({ id: '__bench__' })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-colors rounded-xl p-2',
        isOver ? 'bg-emerald-500/20 ring-2 ring-emerald-400' : 'bg-slate-800/40'
      )}
    >
      {children}
    </div>
  )
}

// ── Draggable player chip ─────────────────────────────────────────────────

function PlayerChip({ player, isAssigned }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
    data: { player },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-grab active:cursor-grabbing',
        'select-none touch-none transition-all',
        isDragging ? 'opacity-30' : '',
        isAssigned
          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
          : 'bg-slate-700/60 border border-slate-600/40 text-white',
      )}
      style={{ transform: CSS.Transform.toString(transform) }}
    >
      <span className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-700 text-xs font-black font-mono shrink-0">
        {player.number ?? '?'}
      </span>
      <span className="text-xs font-medium truncate">{player.name}</span>
    </div>
  )
}

// ── Floating drag overlay ────────────────────────────────────────────────

function FloatingChip({ player }) {
  if (!player) return null
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 shadow-xl shadow-emerald-500/40 text-white text-sm font-bold opacity-95">
      <span className="w-6 h-6 flex items-center justify-center rounded-md bg-emerald-600 font-mono text-xs">
        {player.number ?? '?'}
      </span>
      {player.name}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export function VisualPitch({ formation, assignments, onAssignmentsChange, onFormationChange }) {
  const { players } = useRosterStore()
  const [dragPlayerId, setDragPlayerId] = useState(null)
  const [selectorSlot, setSelectorSlot] = useState(null)

  const slots = FORMATIONS[formation] ?? FORMATIONS['4-3-3']

  // Sensor config: require 8px movement or 200ms hold before activating drag.
  // This prevents conflict with native scroll on mobile.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const getPlayer = useCallback((id) => players.find(p => p.id === id), [players])

  // Players currently on the pitch (assigned to a slot)
  const assignedIds = new Set(Object.values(assignments))

  // Players available in the bench pool (not yet assigned)
  const benchPlayers = players.filter(p => !assignedIds.has(p.id))

  // ── Drag handlers ────────────────────────────────────────────────────────

  const handleDragStart = ({ active }) => setDragPlayerId(active.id)

  const handleDragEnd = ({ active, over }) => {
    setDragPlayerId(null)
    if (!over) return

    const playerId = active.id
    const targetId = over.id   // slot.id or '__bench__'

    const next = { ...assignments }

    // Remove player from any current slot first
    for (const slotId of Object.keys(next)) {
      if (next[slotId] === playerId) delete next[slotId]
    }

    if (targetId !== '__bench__') {
      // Swap: if target slot has someone, they go back to bench (removed)
      next[targetId] = playerId
    }

    onAssignmentsChange(next)
  }

  // Tap on a slot opens a quick-pick list (touch fallback for drag)
  const handleSlotTap = (slot) => {
    setSelectorSlot(slot)
  }

  const handleQuickPick = (playerId) => {
    const next = { ...assignments }
    // Clear previous assignment of this player
    for (const sid of Object.keys(next)) {
      if (next[sid] === playerId) delete next[sid]
    }
    if (playerId) next[selectorSlot.id] = playerId
    else delete next[selectorSlot.id]
    onAssignmentsChange(next)
    setSelectorSlot(null)
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Formation selector */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {FORMATION_NAMES.map(f => (
          <button
            key={f}
            onClick={() => onFormationChange(f)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
              formation === f
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Pitch ─────────────────────────────────────────────────── */}
      <div
        className="relative w-full rounded-xl overflow-hidden bg-emerald-800"
        style={{ aspectRatio: '100 / 65' }}
      >
        <PitchSVG />

        {/* Attack direction label */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[8px] text-white/40 font-bold uppercase tracking-widest">
          Attack ↑
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

      {/* ── Bench / Available pool ─────────────────────────────────── */}
      <div className="mt-3">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
          Available Squad
          <span className="ml-2 text-slate-600 normal-case font-normal">
            · drag onto pitch or tap a slot
          </span>
        </div>
        <BenchPool>
          {benchPlayers.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-2">All players assigned</p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {benchPlayers.map(p => (
                <PlayerChip key={p.id} player={p} isAssigned={false} />
              ))}
            </div>
          )}
        </BenchPool>

        {/* Assigned players (can drag back to bench) */}
        {assignedIds.size > 0 && (
          <div className="mt-2">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">Starting XI</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[...assignedIds].map(pid => {
                const p = getPlayer(pid)
                if (!p) return null
                return <PlayerChip key={pid} player={p} isAssigned />
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Drag overlay ─────────────────────────────────────────── */}
      <DragOverlay dropAnimation={null}>
        <FloatingChip player={dragPlayerId ? getPlayer(dragPlayerId) : null} />
      </DragOverlay>

      {/* ── Quick-pick modal (tap fallback) ─────────────────────── */}
      {selectorSlot && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelectorSlot(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative z-10 w-full max-w-md bg-slate-900 rounded-t-3xl p-5 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">
                {selectorSlot.role} — {assignments[selectorSlot.id] ? 'Replace' : 'Assign'} Player
              </h3>
              <button onClick={() => setSelectorSlot(null)} className="text-slate-400 text-xl">✕</button>
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto no-scrollbar">
              {assignments[selectorSlot.id] && (
                <button
                  onClick={() => handleQuickPick(null)}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold"
                >
                  ✕ Remove from slot
                </button>
              )}
              {players.map(p => {
                const alreadyInOtherSlot = assignedIds.has(p.id) && assignments[selectorSlot.id] !== p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => handleQuickPick(p.id)}
                    className={cn(
                      'w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                      assignments[selectorSlot.id] === p.id
                        ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                        : alreadyInOtherSlot
                          ? 'bg-slate-800/40 text-slate-500'
                          : 'bg-slate-800/60 hover:bg-slate-700/60 text-white',
                    )}
                  >
                    <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700 text-xs font-bold font-mono shrink-0">
                      {p.number ?? '?'}
                    </span>
                    <span className="flex-1 font-medium">{p.name}</span>
                    <span className="text-xs text-slate-500">{p.position}</span>
                    {alreadyInOtherSlot && <span className="text-[10px] text-slate-600">on pitch</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </DndContext>
  )
}
