import { useState } from 'react'
import { useTrainingStore } from '../store/trainingStore'
import { TacticalBoard } from '../components/pitch/TacticalBoard'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { cn } from '../lib/utils'

// ── Drill editor (create / edit) ─────────────────────────────────────────────

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
        <input
          autoFocus
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ej. Pressing alto"
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-xs text-slate-500 mb-1 block">Notas / Instrucciones</label>
        <textarea
          rows={2}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe el ejercicio..."
          className={inputClass + ' resize-none text-sm'}
        />
      </div>

      <TacticalBoard tokens={tokens} onTokensChange={setTokens} />

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button className="flex-1" onClick={handleSave} disabled={!title.trim()}>Guardar</Button>
      </div>
    </div>
  )
}

// ── Drill viewer (board in read-only style) ───────────────────────────────────

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

// ── Page root ─────────────────────────────────────────────────────────────────

export default function Training() {
  const { drills, addDrill, updateDrill } = useTrainingStore()
  const [createOpen, setCreateOpen]   = useState(false)
  const [viewDrill,  setViewDrill]    = useState(null)
  const [editDrill,  setEditDrill]    = useState(null)

  const handleCreate = (data) => addDrill(data)
  const handleEdit   = (data) => { updateDrill(editDrill.id, data); setEditDrill(null) }

  return (
    <div className="page-container">
      <div className="px-4 pt-6 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Entrenamiento</h1>
          <p className="text-sm text-slate-500 mt-0.5">Diseña ejercicios en el pizarrón táctico</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>+ Nuevo</Button>
      </div>

      <div className="px-4 space-y-3">
        {drills.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sin ejercicios</h2>
            <p className="text-slate-500 text-sm mb-6">Crea tu primer ejercicio de entrenamiento.</p>
            <Button onClick={() => setCreateOpen(true)}>+ Crear Ejercicio</Button>
          </div>
        ) : (
          drills.map(drill => (
            <button
              key={drill.id}
              onClick={() => setViewDrill(drill)}
              className="w-full text-left"
            >
              <Card className="hover:border-emerald-500/30 transition-colors active:scale-[0.99]">
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white">{drill.title}</div>
                      {drill.description && (
                        <div className="text-xs text-slate-500 mt-0.5 truncate">{drill.description}</div>
                      )}
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
                          <div
                            key={t.id}
                            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                            style={{ left: `${t.x}%`, top: `${t.y}%`, width: 8, height: 8, background: colors[t.type] ?? '#94a3b8' }}
                          />
                        )
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>
            </button>
          ))
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo Ejercicio" className="sm:max-w-lg">
        <DrillEditor onSave={handleCreate} onClose={() => setCreateOpen(false)} />
      </Modal>

      {viewDrill && (
        <Modal
          open
          onClose={() => setViewDrill(null)}
          title={viewDrill.title}
          className="sm:max-w-lg"
        >
          {editDrill?.id === viewDrill.id ? (
            <DrillEditor
              drill={editDrill}
              onSave={handleEdit}
              onClose={() => setEditDrill(null)}
            />
          ) : (
            <DrillViewer
              drill={viewDrill}
              onEdit={() => setEditDrill(viewDrill)}
              onClose={() => setViewDrill(null)}
            />
          )}
        </Modal>
      )}
    </div>
  )
}
