import { useState } from 'react'
import { useRosterStore } from '../store/rosterStore'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { cn } from '../lib/utils'

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD']

function PlayerForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? { name: '', number: '', position: 'MID' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Full Name *</label>
        <input
          type="text"
          placeholder="Player name"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1 block">Squad Number</label>
          <input
            type="number"
            min="1"
            max="99"
            placeholder="e.g. 10"
            value={form.number}
            onChange={e => set('number', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1 block">Position</label>
          <select
            value={form.position}
            onChange={e => set('position', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
          >
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button
          className="flex-1"
          onClick={() => { onSave({ ...form, number: Number(form.number) || undefined }); onClose() }}
          disabled={!form.name.trim()}
        >
          Save Player
        </Button>
      </div>
    </div>
  )
}

// `embedded` = true when rendered inside Settings (no extra top padding/header)
export { Players }
export default function Players({ embedded = false }) {
  const { players, addPlayer, updatePlayer, removePlayer } = useRosterStore()
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [filterPos, setFilterPos] = useState('ALL')

  const filtered = filterPos === 'ALL' ? players : players.filter(p => p.position === filterPos)
  const grouped = POSITIONS.map(pos => ({ pos, list: filtered.filter(p => p.position === pos) })).filter(g => g.list.length > 0)

  const wrapper = embedded ? 'px-4 space-y-3' : 'page-container'

  return (
    <div className={wrapper}>
      <div className={`flex items-start justify-between ${embedded ? 'py-3' : 'px-4 pt-6 pb-4'}`}>
        <div>
          <h1 className={`font-black text-white ${embedded ? 'text-lg' : 'text-2xl'}`}>Squad</h1>
          <p className="text-sm text-slate-400 mt-0.5">{players.length} players registered</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>+ Add</Button>
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
                filterPos === pos ? activeColor : 'bg-slate-800 text-slate-400 hover:text-white'
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
                <span className="text-xs text-slate-500">{list.length} players</span>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="divide-y divide-slate-700/30">
                {list.map(player => (
                  <div key={player.id} className="flex items-center gap-3 py-3 group">
                    <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-700/60 text-sm font-black font-mono text-white">
                      {player.number ?? '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm">{player.name}</div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditTarget(player)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/60 text-slate-400 hover:text-white transition-colors text-sm"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => removePlayer(player.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/60 text-slate-400 hover:text-red-400 transition-colors text-sm"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-sm">No players in this position</p>
          </div>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Player">
        <PlayerForm onSave={addPlayer} onClose={() => setAddOpen(false)} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Player">
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
