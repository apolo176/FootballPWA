import { cn } from '../../lib/utils'

const colors = {
  emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
  red:     'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30',
  amber:   'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
  sky:     'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/30',
  violet:  'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-500/30',
  slate:   'bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-500/30',
  yellow:  'bg-yellow-100 dark:bg-yellow-400/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-400/30',
  GK:  'bg-amber-500 text-white border-transparent',
  DEF: 'bg-sky-500 text-white border-transparent',
  MID: 'bg-emerald-500 text-white border-transparent',
  FWD: 'bg-red-500 text-white border-transparent',
}

export function Badge({ color = 'slate', className, children }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border', colors[color] ?? colors.slate, className)}>
      {children}
    </span>
  )
}
