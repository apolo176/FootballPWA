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
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">Configure your app & manage squad</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-5 bg-slate-800/40 rounded-xl p-1">
        {[['general','General'],['squad','Squad'],['data','Data']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === k ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >{l}</button>
        ))}
      </div>

      {/* ── General ──────────────────────────────────────────────────────── */}
      {tab === 'general' && (
        <div className="px-4 space-y-4 animate-fade-in">
          <Card>
            <CardHeader><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Team</h3></CardHeader>
            <CardBody className="pt-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="flex-1 bg-slate-700/60 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Team name"
                />
                <Button size="sm" onClick={() => setTeamName(nameInput)}>Save</Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Default Formation</h3></CardHeader>
            <CardBody className="pt-0">
              <div className="flex gap-2 flex-wrap">
                {FORMATION_NAMES.map(f => (
                  <button
                    key={f}
                    onClick={() => setDefaultFormation(f)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      defaultFormation === f ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >{f}</button>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Match Duration</h3></CardHeader>
            <CardBody className="pt-0">
              <div className="flex gap-2 flex-wrap">
                {DURATIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setMatchDuration(d)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      matchDuration === d ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >{d}'</button>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-2">Full match = {matchDuration} min</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Appearance</h3></CardHeader>
            <CardBody className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Dark Mode</div>
                  <div className="text-xs text-slate-500">Currently {dark ? 'dark' : 'light'}</div>
                </div>
                <button
                  onClick={toggle}
                  className={`w-12 h-6 rounded-full transition-all duration-300 ${dark ? 'bg-emerald-500' : 'bg-slate-600'}`}
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
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/20 transition-colors active:scale-[0.98]"
          >
            ↓ Export Full Season CSV
          </button>

          <Card>
            <CardHeader><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Match History</h3></CardHeader>
            <CardBody className="pt-0">
              <p className="text-sm text-slate-400 mb-3">
                Permanently delete all match data. This cannot be undone.
              </p>
              {!confirmClear ? (
                <Button variant="danger" size="sm" onClick={() => setConfirmClear(true)}>
                  Clear All Match Data
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-400 font-semibold">Are you sure? This removes all history.</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>Cancel</Button>
                    <Button variant="danger" size="sm" onClick={handleClearAll}>Yes, Delete All</Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Storage Info</h3></CardHeader>
            <CardBody className="pt-0 space-y-1.5 text-sm text-slate-400">
              <div className="flex justify-between"><span>Squad players</span><span className="font-semibold text-white">{players.length}</span></div>
              <div className="flex justify-between"><span>Training drills</span><span className="font-semibold text-white">{drills.length}</span></div>
              <div className="flex justify-between"><span>App version</span><span className="font-semibold text-white">1.0.0</span></div>
              <div className="text-xs text-slate-600 mt-2">All data is stored locally on this device (localStorage).</div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
