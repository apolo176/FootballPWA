import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatchStore } from '../store/matchStore'
import { useSettingsStore } from '../store/settingsStore'
import { VisualPitch } from '../components/pitch/VisualPitch'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { FORMATIONS } from '../lib/constants'

export default function Setup() {
  const navigate  = useNavigate()
  const { activeMatch, matchHistory, startNewMatch, updateSetup } = useMatchStore()
  const { defaultFormation } = useSettingsStore()

  // Default to last used formation/assignments so the coach doesn't re-do
  // lineup from scratch for every match.
  const template = matchHistory[0]

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    opponent:    '',
    date:        new Date().toISOString().slice(0, 10),
    venue:       'home',
    stadium:     '',
    competition: '',
    referee:     '',
    formation:   template?.formation ?? defaultFormation ?? '4-3-3',
    assignments: template?.assignments ?? {},
    bench:       template?.bench ?? [],  // pre-fill from last match, max 6
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Lineup = all players assigned to pitch slots
  const lineup = Object.values(form.assignments).filter(Boolean)

  // ── Step 0: Match info ─────────────────────────────────────────────────

  const handleInfoNext = () => {
    if (!form.opponent.trim()) return
    setStep(1)
  }

  // ── Step 1: Visual pitch ───────────────────────────────────────────────

  const handleKickOff = () => {
    const match = startNewMatch({ ...form, lineup, bench: form.bench })
    // kickOff() is called by useMatchEngine when it mounts on /live,
    // but we need phase = LIVE before navigating. Call store action directly.
    useMatchStore.getState().kickOff()
    navigate('/live')
  }

  const inputClass = "w-full bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"

  return (
    <div className="page-container">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Configurar Partido</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {step === 0 ? 'Rellena los detalles del partido' : 'Configura formación y alineación'}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 px-4 mb-5">
        {['Info', 'Alineación'].map((label, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            <div className={`text-xs mt-1 font-medium ${i === step ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Step 0: Match Info ── */}
      {step === 0 && (
        <div className="px-4 space-y-4 animate-fade-in">
          <Card>
            <CardHeader><h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rival</h2></CardHeader>
            <CardBody className="pt-0">
              <input
                autoFocus
                type="text"
                placeholder="Nombre del equipo rival"
                value={form.opponent}
                onChange={e => set('opponent', e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-lg font-semibold placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detalles</h2></CardHeader>
            <CardBody className="pt-0 space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Fecha</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => set('date', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Sede</label>
                  <select
                    value={form.venue}
                    onChange={e => set('venue', e.target.value)}
                    className={inputClass + ' appearance-none'}
                  >
                    <option value="home">🏠 Local</option>
                    <option value="away">✈️ Visitante</option>
                    <option value="neutral">⚖️ Neutral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Competición</label>
                <input
                  type="text"
                  placeholder="Liga / Copa"
                  value={form.competition}
                  onChange={e => set('competition', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Estadio</label>
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={form.stadium}
                    onChange={e => set('stadium', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Árbitro</label>
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={form.referee}
                    onChange={e => set('referee', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Button size="lg" className="w-full" onClick={handleInfoNext} disabled={!form.opponent.trim()}>
            Siguiente: Alineación →
          </Button>
        </div>
      )}

      {/* ── Step 1: Visual Pitch ── */}
      {step === 1 && (
        <div className="px-4 space-y-4 animate-fade-in">
          <VisualPitch
            formation={form.formation}
            assignments={form.assignments}
            bench={form.bench}
            onAssignmentsChange={(assignments) => set('assignments', assignments)}
            onBenchChange={(bench) => set('bench', bench)}
            onFormationChange={(formation) => {
              set('formation', formation)
              set('assignments', {})
            }}
          />

          {/* Summary strip */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-slate-900 dark:text-white font-bold">vs {form.opponent}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{form.formation}</div>
                </div>
                <div className="flex gap-3 text-center">
                  <div>
                    <div className={`text-lg font-black ${lineup.length === 11 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {lineup.length}/11
                    </div>
                    <div className="text-[10px] text-slate-500">Titulares</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-600 dark:text-slate-300">{form.bench.length}/6</div>
                    <div className="text-[10px] text-slate-500">Banquillo</div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="flex gap-3">
            <Button variant="ghost" size="lg" className="flex-1" onClick={() => setStep(0)}>
              ← Atrás
            </Button>
            <Button size="lg" className="flex-1" onClick={handleKickOff}>
              🚀 ¡Empezar!
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
