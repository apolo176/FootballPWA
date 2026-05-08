import { useState, useMemo } from 'react'
import { useTrainingStore } from '../store/trainingStore'
import { useRosterStore } from '../store/rosterStore'
import { TacticalBoard } from '../components/pitch/TacticalBoard'
import { BottomSheet } from '../components/match/sheets/BottomSheet'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { cn } from '../lib/utils'
import { ATTENDANCE_STATUS } from '../lib/constants'

// ── Shared helpers ─────────────────────────────────────────────────────────

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD']

function formatSessionDate(iso) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatSessionShort(iso) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function sessionSummary(session, total) {
  const counts = { attended: 0, excused: 0, absent: 0 }
  Object.values(session.attendance).forEach(v => { if (v in counts) counts[v]++ })
  return { ...counts, total, logged: counts.attended + counts.excused + counts.absent }
}

// ── Attendance button ──────────────────────────────────────────────────────

const ATTEND_BTN = {
  attended: {
    active:   'bg-emerald-500 text-white border-emerald-500',
    inactive: 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-600',
  },
  excused: {
    active:   'bg-amber-400 text-white border-amber-400',
    inactive: 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600',
  },
  absent: {
    active:   'bg-red-500 text-white border-red-500',
    inactive: 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border-red-300 dark:border-red-600',
  },
}

function AttendanceButtons({ current, onChange }) {
  return (
    <div className="flex gap-1 shrink-0">
      {Object.entries(ATTENDANCE_STATUS).map(([key, meta]) => (
        <button
          key={key}
          onClick={() => onChange(current === key ? null : key)}
          className={cn(
            'w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-black transition-all active:scale-90',
            ATTEND_BTN[key][current === key ? 'active' : 'inactive']
          )}
          title={meta.label}
        >
          {meta.emoji}
        </button>
      ))}
    </div>
  )
}

// ── Attendance session sheet ───────────────────────────────────────────────

function AttendanceSheet({ session, open, onClose }) {
  const { players } = useRosterStore()
  const { setAttendance } = useTrainingStore()

  const grouped = POSITIONS
    .map(pos => ({ pos, list: players.filter(p => p.position === pos) }))
    .filter(g => g.list.length > 0)

  const summary = useMemo(() => {
    if (!session) return null
    return sessionSummary(session, players.length)
  }, [session, players.length])

  if (!session) return null

  const attended = summary.attended
  const total    = players.length
  const pct      = total > 0 ? Math.round((attended / total) * 100) : 0

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`Sesión — ${formatSessionShort(session.date)}`}
      tall
    >
      <div className="px-4 pt-3 pb-8 space-y-4">

        {/* Summary bar */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-900 dark:text-white">{attended} / {total} asistieron</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">{pct}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-3 text-xs text-slate-500">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{summary.attended} ✓</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">{summary.excused} ~</span>
            <span className="text-red-600 dark:text-red-400 font-bold">{summary.absent} ✗</span>
            <span className="ml-auto">{total - summary.logged} sin marcar</span>
          </div>
        </div>

        {/* Roster by position */}
        {grouped.map(({ pos, list }) => (
          <div key={pos}>
            <div className="flex items-center gap-2 mb-2">
              <Badge color={pos}>{pos}</Badge>
              <span className="text-xs text-slate-400">{list.length} jugadores</span>
            </div>
            <div className="space-y-1.5">
              {list.map(player => {
                const current = session.attendance[player.id] ?? null
                return (
                  <div
                    key={player.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors',
                      current === 'attended' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                      : current === 'excused'  ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                      : current === 'absent'   ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30'
                    )}
                  >
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60 text-xs font-black font-mono text-slate-600 dark:text-slate-300 shrink-0">
                      {player.number ?? '?'}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {player.name}
                    </span>
                    <AttendanceButtons
                      current={current}
                      onChange={(val) => setAttendance(session.id, player.id, val)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  )
}

// ── Attendance tab ─────────────────────────────────────────────────────────

function AttendanceTab() {
  const { trainingHistory, addSession, deleteSession } = useTrainingStore()
  const { players } = useRosterStore()
  const [newDateOpen,    setNewDateOpen]    = useState(false)
  const [newDate,        setNewDate]        = useState(new Date().toISOString().slice(0, 10))
  const [activeSession,  setActiveSession]  = useState(null)

  const sessions = [...trainingHistory].sort((a, b) => b.date.localeCompare(a.date))

  const handleCreate = () => {
    const session = addSession(newDate)
    setNewDateOpen(false)
    setActiveSession(session)
  }

  const openSession = (session) => {
    // Re-read from store to always have fresh data
    setActiveSession(session)
  }

  return (
    <div className="px-4 space-y-3">
      {/* New session CTA */}
      <button
        onClick={() => { setNewDate(new Date().toISOString().slice(0, 10)); setNewDateOpen(true) }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-bold active:scale-[0.98] transition-all shadow-lg shadow-emerald-900/10"
      >
        + Nueva Sesión de Asistencia
      </button>

      {/* Session list */}
      {sessions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-slate-900 dark:text-white font-bold text-lg mb-1">Sin sesiones</p>
          <p className="text-slate-500 text-sm">Crea la primera sesión para registrar asistencia.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => {
            const s = sessionSummary(session, players.length)
            const pct = players.length > 0 ? Math.round((s.attended / players.length) * 100) : 0
            return (
              <button
                key={session.id}
                onClick={() => openSession(session)}
                className="w-full text-left"
              >
                <Card className="hover:border-emerald-400/50 active:scale-[0.99] transition-all group">
                  <CardBody>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white text-sm capitalize truncate">
                          {formatSessionDate(session.date)}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{formatSessionShort(session.date)}</div>
                        {/* Mini attendance bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-500 shrink-0">{pct}%</span>
                        </div>
                      </div>
                      {/* Summary chips */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex gap-1.5 text-xs font-bold">
                          {s.attended > 0 && <span className="text-emerald-600 dark:text-emerald-400">{s.attended}✓</span>}
                          {s.excused  > 0 && <span className="text-amber-600 dark:text-amber-400">{s.excused}~</span>}
                          {s.absent   > 0 && <span className="text-red-600 dark:text-red-400">{s.absent}✗</span>}
                        </div>
                        <span className="text-xs text-slate-400">{players.length - s.logged} sin marcar</span>
                      </div>
                      {/* Delete */}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-red-500 transition-all text-sm shrink-0"
                        title="Eliminar sesión"
                      >
                        🗑
                      </button>
                    </div>
                  </CardBody>
                </Card>
              </button>
            )
          })}
        </div>
      )}

      {/* New session modal */}
      <Modal open={newDateOpen} onClose={() => setNewDateOpen(false)} title="Nueva Sesión">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Fecha del entrenamiento</label>
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setNewDateOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleCreate}>Crear y Marcar</Button>
          </div>
        </div>
      </Modal>

      {/* Attendance sheet — re-reads from store on each render for live updates */}
      {activeSession && (
        <AttendanceSheet
          session={trainingHistory.find(s => s.id === activeSession.id) ?? activeSession}
          open={!!activeSession}
          onClose={() => setActiveSession(null)}
        />
      )}
    </div>
  )
}

// ── Drill editor ───────────────────────────────────────────────────────────

function DrillEditor({ drill, onSave, onClose }) {
  const [title,       setTitle]       = useState(drill?.title       ?? '')
  const [description, setDescription] = useState(drill?.description ?? '')
  const [tokens,      setTokens]      = useState(drill?.tokens      ?? [])

  const handleSave = () => {
    if (!title.trim()) return
    onSave({ title: title.trim(), description, tokens })
    onClose()
  }

  const inputClass = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Nombre del Ejercicio *</label>
        <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Pressing alto" className={inputClass} />
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Notas / Instrucciones</label>
        <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe el ejercicio..." className={inputClass + ' resize-none text-sm'} />
      </div>
      <TacticalBoard tokens={tokens} onTokensChange={setTokens} />
      <div className="flex gap-3 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button className="flex-1" onClick={handleSave} disabled={!title.trim()}>Guardar</Button>
      </div>
    </div>
  )
}

function DrillViewer({ drill, onEdit, onClose }) {
  const { deleteDrill } = useTrainingStore()
  const [tokens, setTokens] = useState(drill.tokens)

  return (
    <div className="space-y-3">
      {drill.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 rounded-xl px-4 py-3">{drill.description}</p>
      )}
      <TacticalBoard tokens={tokens} onTokensChange={setTokens} />
      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="ghost" className="flex-1" onClick={onEdit}>Editar</Button>
        <Button size="sm" variant="danger" onClick={() => { deleteDrill(drill.id); onClose() }}>Eliminar</Button>
      </div>
    </div>
  )
}

// ── Drills tab ─────────────────────────────────────────────────────────────

function DrillsTab() {
  const { drills, addDrill, updateDrill } = useTrainingStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [viewDrill,  setViewDrill]  = useState(null)
  const [editDrill,  setEditDrill]  = useState(null)

  const handleCreate = (data) => addDrill(data)
  const handleEdit   = (data) => { updateDrill(editDrill.id, data); setEditDrill(null) }

  return (
    <div className="px-4 space-y-3">
      <button
        onClick={() => setCreateOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 dark:bg-slate-700 text-white text-sm font-bold active:scale-[0.98] transition-all"
      >
        + Nuevo Ejercicio
      </button>

      {drills.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🗒️</div>
          <p className="text-slate-900 dark:text-white font-bold text-lg mb-1">Sin ejercicios</p>
          <p className="text-slate-500 text-sm">Diseña ejercicios en el pizarrón táctico.</p>
        </div>
      ) : (
        drills.map(drill => (
          <button key={drill.id} onClick={() => setViewDrill(drill)} className="w-full text-left">
            <Card className="hover:border-emerald-500/30 transition-colors active:scale-[0.99]">
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white">{drill.title}</div>
                    {drill.description && <div className="text-xs text-slate-500 mt-0.5 truncate">{drill.description}</div>}
                  </div>
                  <div className="flex gap-1.5 shrink-0 text-xs text-slate-500">
                    <span>{drill.tokens.filter(t => t.type === 'player').length} 👤</span>
                    <span>{drill.tokens.filter(t => t.type === 'opponent').length} 🔴</span>
                    {drill.tokens.filter(t => t.type === 'cone').length > 0 && (
                      <span>{drill.tokens.filter(t => t.type === 'cone').length} 🟠</span>
                    )}
                  </div>
                </div>
                {drill.tokens.length > 0 && (
                  <div className="mt-3 relative rounded-lg overflow-hidden bg-emerald-900/60" style={{ height: 60 }}>
                    {drill.tokens.map(t => {
                      const colors = { player: '#38bdf8', opponent: '#f87171', cone: '#fb923c', ball: '#f1f5f9' }
                      return (
                        <div key={t.id} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${t.x}%`, top: `${t.y}%`, width: 8, height: 8, background: colors[t.type] ?? '#94a3b8' }} />
                      )
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </button>
        ))
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo Ejercicio" className="sm:max-w-lg">
        <DrillEditor onSave={handleCreate} onClose={() => setCreateOpen(false)} />
      </Modal>

      {viewDrill && (
        <Modal open onClose={() => setViewDrill(null)} title={viewDrill.title} className="sm:max-w-lg">
          {editDrill?.id === viewDrill.id ? (
            <DrillEditor drill={editDrill} onSave={handleEdit} onClose={() => setEditDrill(null)} />
          ) : (
            <DrillViewer drill={viewDrill} onEdit={() => setEditDrill(viewDrill)} onClose={() => setViewDrill(null)} />
          )}
        </Modal>
      )}
    </div>
  )
}

// ── Page root ──────────────────────────────────────────────────────────────

export default function Training() {
  const [tab, setTab] = useState('attendance')

  return (
    <div className="page-container">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Entrenamiento</h1>
        <p className="text-sm text-slate-500 mt-0.5">Asistencia y ejercicios tácticos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-5 bg-slate-100 dark:bg-slate-800/40 rounded-xl p-1">
        <button
          onClick={() => setTab('attendance')}
          className={cn('flex-1 py-2 rounded-lg text-xs font-bold transition-all', tab === 'attendance' ? 'bg-emerald-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')}
        >
          📋 Asistencia
        </button>
        <button
          onClick={() => setTab('drills')}
          className={cn('flex-1 py-2 rounded-lg text-xs font-bold transition-all', tab === 'drills' ? 'bg-emerald-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')}
        >
          🗒️ Ejercicios
        </button>
      </div>

      {tab === 'attendance' && <AttendanceTab />}
      {tab === 'drills'     && <DrillsTab />}
    </div>
  )
}
