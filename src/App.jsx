import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSettingsStore } from './store/settingsStore'
import { BottomNav } from './components/navigation/BottomNav'
import Home      from './pages/Home'
import Setup     from './pages/Setup'
import LiveMatch from './pages/LiveMatch'
import Stats     from './pages/Stats'
import Players   from './pages/Players'
import Training  from './pages/Training'
import Settings  from './pages/Settings'

export default function App() {
  const { theme } = useSettingsStore()

  // Single DOM-class sync: keeps every useTheme() call in sync because
  // they all read from the same Zustand store, and this one effect
  // is the only place that touches document.documentElement.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme !== 'light')
  }, [theme])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Routes>
          <Route path="/"         element={<Home />}      />
          <Route path="/setup"    element={<Setup />}     />
          <Route path="/live"     element={<LiveMatch />} />
          <Route path="/stats"    element={<Stats />}     />
          <Route path="/players"  element={<Players />}   />
          <Route path="/training" element={<Training />}  />
          <Route path="/settings" element={<Settings />}  />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
