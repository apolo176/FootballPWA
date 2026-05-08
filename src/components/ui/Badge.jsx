import { cn } from '../../lib/utils'

const colors = {
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  red:     'bg-red-500/20 text-red-300 border-red-500/30',
  amber:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
  sky:     'bg-sky-500/20 text-sky-300 border-sky-500/30',
  violet:  'bg-violet-500/20 text-violet-300 border-violet-500/30',
  slate:   'bg-slate-500/20 text-slate-300 border-slate-500/30',
  yellow:  'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
  GK:  'bg-amber-500 text-white',
  DEF: 'bg-sky-500 text-white',
  MID: 'bg-emerald-500 text-white',
  FWD: 'bg-red-500 text-white',
}

export function Badge({ color = 'slate', className, children }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border', colors[color] ?? colors.slate, className)}>
      {children}
    </span>
  )
}
