import { useState } from 'react'
import { useRosterStore } from '../store/rosterStore'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { cn } from '../lib/utils'
import { PLAYER_STATUS } from '../lib/constants'

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD']

// ── Status pill styling ────────────────────────────────────────────────────

const STATUS_PILL = {
  available: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
  injured:   'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30',
  suspended: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-500/30',
  absent:    'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
}

// ── Player form ────────────────────────────────────────────────────────────

function PlayerForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? { name: '', number: '', position: 'MID' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Nombre completo *</label>
        <input
          type="text"
          placeholder="Nombre del jugador"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1 block">Dorsal</label>
          <input
            type="number"
            min="1"
            max="99"
            placeholder="Ej. 10"
            value={form.number}
            onChange={e => set('number', e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1 block">Posición</label>
          <select
            value={form.position}
            onChange={e => set('position', e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
          >
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button
          className="flex-1"
          onClick={() => { onSave({ ...form, number: Number(form.number) || undefined }); onClose() }}
          disabled={!form.name.trim()}
        >
          Guardar
        </Button>
      </div>
    </div>
  )
}

// ── `embedded` = true when rendered inside Settings (no extra top padding/header) ──

export { Players }
export default function Players({ embedded = false }) {
  const { players, addPlayer, updatePlayer, removePlayer, setPlayerStatus } = useRosterStore()
  const [addOpen,          setAddOpen]          = useState(false)
  const [editTarget,       setEditTarget]        = useState(null)
  const [filterPos,        setFilterPos]         = useState('ALL')
  const [statusPickerId,   setStatusPickerId]    = useState(null)  // which player has status picker open

  const filtered = filterPos === 'ALL' ? players : players.filter(p => p.position === filterPos)
  const grouped = POSITIONS.map(pos => ({ pos, list: filtered.filter(p => p.position === pos) })).filter(g => g.list.length > 0)

  const wrapper = embedded ? 'px-4 space-y-3' : 'page-container'

  return (
    <div className={wrapper}>
      <div className={`flex items-start justify-between ${embedded ? 'py-3' : 'px-4 pt-6 pb-4'}`}>
        <div>
          <h1 className={`font-black text-slate-900 dark:text-white ${embedded ? 'text-lg' : 'text-2xl'}`}>Plantilla</h1>
          <p className="text-sm text-slate-500 mt-0.5">{players.length} jugadores registrados</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>+ Añadir</Button>
      </div>

      {/* Position filter pills */}
      <div className={`flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1 ${embedded ? '' : 'px-4'}`}>
        {['ALL', ...POSITIONS].map(pos => {
          const activeColor = {
            ALL: 'bg-emerald-500 text-white',
            GK:  'bg-amber-500 text-white',
            DEF: 'bg-sky-500 text-white',
            MID: 'bg-emerald-500 text-white',
            FWD: 'bg-red-500 text-white',
          }[pos]
          return (
            <button
              key={pos}
              onClick={() => setFilterPos(pos)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                filterPos === pos ? activeColor : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              {pos}
            </button>
          )
        })}
      </div>

      <div className={`space-y-4 ${embedded ? '' : 'px-4'}`}>
        {grouped.map(({ pos, list }) => (
          <Card key={pos}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge color={pos}>{pos}</Badge>
                <span className="text-xs text-slate-500">{list.length} jugadores</span>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-700/30">
                {list.map(player => {
                  const pStatus = player.status ?? 'available'
                  const statusMeta = PLAYER_STATUS[pStatus]
                  const isPickerOpen = statusPickerId === player.id

                  return (
                    <div key={player.id}>
                      <div className="flex items-center gap-3 py-3 group">
                        {/* Number badge */}
                        <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/60 text-sm font-black font-mono text-slate-700 dark:text-white shrink-0">
                          {player.number ?? '—'}
                        </div>

                        {/* Name + status */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{player.name}</div>
                          {/* Tappable status pill */}
                          <button
                            onClick={() => setStatusPickerId(isPickerOpen ? null : player.id)}
                            className={cn(
                              'mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all active:scale-95',
                              STATUS_PILL[pStatus]
                            )}
                          >
                            {statusMeta.emoji} {statusMeta.label}
                          </button>
                        </div>

                        {/* Edit / delete */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => setEditTarget(player)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => removePlayer(player.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors text-sm"
                          >
                            🗑
                          </button>
                        </div>
                      </div>

                      {/* Inline status picker */}
                      {isPickerOpen && (
                        <div className="flex flex-wrap gap-1.5 pb-3 pl-12">
                          {Object.entries(PLAYER_STATUS).map(([key, meta]) => (
                            <button
                              key={key}
                              onClick={() => { setPlayerStatus(player.id, key); setStatusPickerId(null) }}
                              className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95',
                                pStatus === key
                                  ? STATUS_PILL[key]
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                              )}
                            >
                              {meta.emoji} {meta.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-sm">No hay jugadores en esta posición</p>
          </div>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Añadir Jugador">
        <PlayerForm onSave={addPlayer} onClose={() => setAddOpen(false)} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar Jugador">
        {editTarget && (
          <PlayerForm
            initial={editTarget}
            onSave={data => updatePlayer(editTarget.id, data)}
            onClose={() => setEditTarget(null)}
          />
        )}
      </Modal>
    </div>
  )
}
