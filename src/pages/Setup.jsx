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
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Derive lineup from assignments (slot values = playerIds)
  const lineup = Object.values(form.assignments).filter(Boolean)

  // ── Step 0: Match info ─────────────────────────────────────────────────

  const handleInfoNext = () => {
    if (!form.opponent.trim()) return
    setStep(1)
  }

  // ── Step 1: Visual pitch ───────────────────────────────────────────────

  const handleKickOff = () => {
    const match = startNewMatch({ ...form, lineup, bench: [] })
    // kickOff() is called by useMatchEngine when it mounts on /live,
    // but we need phase = LIVE before navigating. Call store action directly.
    useMatchStore.getState().kickOff()
    navigate('/live')
  }

  return (
    <div className="page-container">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-black text-white">Match Setup</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {step === 0 ? 'Fill in match details' : 'Set your formation & lineup'}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 px-4 mb-5">
        {['Match Info', 'Lineup'].map((label, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-emerald-500' : 'bg-slate-700'}`} />
            <div className={`text-xs mt-1 font-medium ${i === step ? 'text-emerald-400' : 'text-slate-600'}`}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Step 0: Match Info ── */}
      {step === 0 && (
        <div className="px-4 space-y-4 animate-fade-in">
          <Card>
            <CardHeader><h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Opponent</h2></CardHeader>
            <CardBody className="pt-0">
              <input
                autoFocus
                type="text"
                placeholder="Opponent team name"
                value={form.opponent}
                onChange={e => set('opponent', e.target.value)}
                className="w-full bg-slate-700/60 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Details</h2></CardHeader>
            <CardBody className="pt-0 space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => set('date', e.target.value)}
                    className="w-full bg-slate-700/60 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Venue</label>
                  <select
                    value={form.venue}
                    onChange={e => set('venue', e.target.value)}
                    className="w-full bg-slate-700/60 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                  >
                    <option value="home">🏠 Home</option>
                    <option value="away">✈️ Away</option>
                    <option value="neutral">⚖️ Neutral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Competition</label>
                <input
                  type="text"
                  placeholder="League / Cup"
                  value={form.competition}
                  onChange={e => set('competition', e.target.value)}
                  className="w-full bg-slate-700/60 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Stadium</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={form.stadium}
                    onChange={e => set('stadium', e.target.value)}
                    className="w-full bg-slate-700/60 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Referee</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={form.referee}
                    onChange={e => set('referee', e.target.value)}
                    className="w-full bg-slate-700/60 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Button size="lg" className="w-full" onClick={handleInfoNext} disabled={!form.opponent.trim()}>
            Next: Set Lineup →
          </Button>
        </div>
      )}

      {/* ── Step 1: Visual Pitch ── */}
      {step === 1 && (
        <div className="px-4 space-y-4 animate-fade-in">
          <VisualPitch
            formation={form.formation}
            assignments={form.assignments}
            onAssignmentsChange={(assignments) => set('assignments', assignments)}
            onFormationChange={(formation) => {
              // Clear assignments when formation changes to avoid orphaned slots
              set('formation', formation)
              set('assignments', {})
            }}
          />

          {/* Summary strip */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-bold">vs {form.opponent}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {form.formation} · {lineup.length}/11 players assigned
                  </div>
                </div>
                <div className="text-right">
                  {lineup.length < 11 && (
                    <div className="text-xs text-amber-400">⚠️ {11 - lineup.length} slots empty</div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="flex gap-3">
            <Button variant="ghost" size="lg" className="flex-1" onClick={() => setStep(0)}>
              ← Back
            </Button>
            <Button size="lg" className="flex-1" onClick={handleKickOff}>
              🚀 Kick Off!
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
