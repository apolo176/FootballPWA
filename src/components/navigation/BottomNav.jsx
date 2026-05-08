import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useMatchStore } from '../../store/matchStore'
import { PHASE } from '../../lib/constants'

const NAV = [
  { to: '/',         label: 'Inicio',       Icon: HomeIcon    },
  { to: '/training', label: 'Entrenamiento', Icon: TrainingIcon },
  { to: '/live',     label: 'Directo',      Icon: LiveIcon,     center: true },
  { to: '/stats',    label: 'Stats',        Icon: StatsIcon   },
  { to: '/settings', label: 'Ajustes',      Icon: SettingsIcon },
]

export function BottomNav() {
  const { activeMatch } = useMatchStore()
  const isLive = activeMatch?.phase === PHASE.LIVE

  return (
    <nav className={cn(
      'fixed bottom-0 inset-x-0 z-40',
      'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md',
      'border-t border-slate-200 dark:border-slate-800',
      'safe-bottom',
    )}>
      <div className="flex items-end justify-around h-16 px-2 max-w-lg mx-auto">
        {NAV.map(({ to, label, Icon, center }) => (
          <NavLink key={to} to={to} className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full focus-visible:outline-none">
            {({ isActive }) =>
              center ? (
                <div className={cn(
                  '-mt-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
                  'transition-all duration-200 active:scale-90',
                  isLive
                    ? 'bg-red-500 shadow-red-500/40 ring-2 ring-red-400/50'
                    : 'bg-emerald-500 shadow-emerald-500/40',
                  isActive && 'scale-105 shadow-xl',
                )}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
              ) : (
                <>
                  <Icon className={cn('w-5 h-5 transition-colors',
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                  )} />
                  <span className={cn('text-[10px] font-medium transition-colors',
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                  )}>
                    {label}
                  </span>
                </>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 12 2-2m0 0 7-7 7 7M5 10v10a1 1 0 001 1h3m10-11 2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function TrainingIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function LiveIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" opacity={0.25} />
      <circle cx="12" cy="12" r="5" />
    </svg>
  )
}

function StatsIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm9.75-4.5c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z" />
    </svg>
  )
}

function SettingsIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
