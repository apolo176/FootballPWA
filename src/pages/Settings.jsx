import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../store/settingsStore'
import { useMatchStore } from '../store/matchStore'
import { useRosterStore } from '../store/rosterStore'
import { useTrainingStore } from '../store/trainingStore'
import { useTheme } from '../hooks/useTheme'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FORMATION_NAMES } from '../lib/constants'
import { exportSeasonCSV } from '../lib/exportCSV'
import { Players } from './Players'

const DURATIONS = [60, 70, 80, 90, 100, 120]

export default function Settings() {
  const navigate = useNavigate()
  const { teamName, matchDuration, defaultFormation, setTeamName, setMatchDuration, setDefaultFormation } = useSettingsStore()
  const { clearAllData: clearMatches, matchHistory } = useMatchStore()
  const { players, addPlayer, updatePlayer, removePlayer } = useRosterStore()
  const { drills, deleteDrill } = useTrainingStore()
  const { dark, toggle } = useTheme()

  const [tab, setTab] = useState('general')
  const [confirmClear, setConfirmClear] = useState(false)
  const [nameInput, setNameInput] = useState(teamName)

  const handleClearAll = () => {
    clearMatches()
    setConfirmClear(false)
  }

  return (
    <div className="page-container">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Ajustes</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configura la app y gestiona la plantilla</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-5 bg-slate-100 dark:bg-slate-800/40 rounded-xl p-1">
        {[['general','General'],['squad','Plantilla'],['data','Datos']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === k ? 'bg-emerald-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >{l}</button>
        ))}
      </div>

      {/* ── General ──────────────────────────────────────────────────────── */}
      {tab === 'general' && (
        <div className="px-4 space-y-4 animate-fade-in">
          <Card>
            <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Equipo</h3></CardHeader>
            <CardBody className="pt-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nombre del equipo"
                />
                <Button size="sm" onClick={() => setTeamName(nameInput)}>Guardar</Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Formación por Defecto</h3></CardHeader>
            <CardBody className="pt-0">
              <div className="flex gap-2 flex-wrap">
                {FORMATION_NAMES.map(f => (
                  <button
                    key={f}
                    onClick={() => setDefaultFormation(f)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      defaultFormation === f ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >{f}</button>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Duración del Partido</h3></CardHeader>
            <CardBody className="pt-0">
              <div className="flex gap-2 flex-wrap">
                {DURATIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setMatchDuration(d)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      matchDuration === d ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >{d}'</button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">Partido completo = {matchDuration} min</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Apariencia</h3></CardHeader>
            <CardBody className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Modo Oscuro</div>
                  <div className="text-xs text-slate-500">Actualmente {dark ? 'oscuro' : 'claro'}</div>
                </div>
                <button
                  onClick={toggle}
                  className={`w-12 h-6 rounded-full transition-all duration-300 ${dark ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 mx-0.5 ${dark ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── Squad ────────────────────────────────────────────────────────── */}
      {tab === 'squad' && <Players embedded />}

      {/* ── Data ─────────────────────────────────────────────────────────── */}
      {tab === 'data' && (
        <div className="px-4 space-y-4 animate-fade-in">
          {/* Season export */}
          <button
            onClick={() => exportSeasonCSV(matchHistory, players)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-sm font-semibold hover:bg-emerald-500/20 transition-colors active:scale-[0.98]"
          >
            ↓ Exportar Temporada CSV
          </button>

          <Card>
            <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Historial de Partidos</h3></CardHeader>
            <CardBody className="pt-0">
              <p className="text-sm text-slate-500 mb-3">
                Elimina permanentemente todos los datos. Esta acción no se puede deshacer.
              </p>
              {!confirmClear ? (
                <Button variant="danger" size="sm" onClick={() => setConfirmClear(true)}>
                  Borrar Todo
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-500 font-semibold">¿Seguro? Esto elimina todo el historial.</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>Cancelar</Button>
                    <Button variant="danger" size="sm" onClick={handleClearAll}>Sí, Borrar Todo</Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Almacenamiento</h3></CardHeader>
            <CardBody className="pt-0 space-y-1.5 text-sm text-slate-500">
              <div className="flex justify-between"><span>Jugadores</span><span className="font-semibold text-slate-900 dark:text-white">{players.length}</span></div>
              <div className="flex justify-between"><span>Drills de entrenamiento</span><span className="font-semibold text-slate-900 dark:text-white">{drills.length}</span></div>
              <div className="flex justify-between"><span>Versión</span><span className="font-semibold text-slate-900 dark:text-white">1.0.0</span></div>
              <div className="text-xs text-slate-400 mt-2">Todos los datos se guardan localmente en este dispositivo (localStorage).</div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
