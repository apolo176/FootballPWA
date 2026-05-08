import { cn } from '../../lib/utils'

const colorMap = {
  emerald: {
    bg: 'bg-emerald-500 active:bg-emerald-400',
    glow: 'shadow-emerald-500/30',
    ring: 'focus-visible:ring-emerald-400',
  },
  red: {
    bg: 'bg-red-500 active:bg-red-400',
    glow: 'shadow-red-500/30',
    ring: 'focus-visible:ring-red-400',
  },
  amber: {
    bg: 'bg-amber-400 active:bg-amber-300',
    glow: 'shadow-amber-400/30',
    ring: 'focus-visible:ring-amber-300',
  },
  yellow: {
    bg: 'bg-yellow-400 active:bg-yellow-300',
    glow: 'shadow-yellow-400/30',
    ring: 'focus-visible:ring-yellow-300',
  },
  sky: {
    bg: 'bg-sky-500 active:bg-sky-400',
    glow: 'shadow-sky-500/30',
    ring: 'focus-visible:ring-sky-400',
  },
  violet: {
    bg: 'bg-violet-500 active:bg-violet-400',
    glow: 'shadow-violet-500/30',
    ring: 'focus-visible:ring-violet-400',
  },
  slate: {
    bg: 'bg-slate-600 active:bg-slate-500',
    glow: 'shadow-slate-600/30',
    ring: 'focus-visible:ring-slate-400',
  },
}

export function EventButton({ emoji, label, color = 'emerald', size = 'md', className, onClick, disabled }) {
  const c = colorMap[color] ?? colorMap.slate

  const sizeClass = {
    sm: 'h-16 text-2xl',
    md: 'h-20 text-3xl',
    lg: 'h-24 text-4xl',
    xl: 'h-28 text-5xl',
  }[size] ?? 'h-20 text-3xl'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'action-btn press-shimmer w-full flex-col',
        'shadow-lg',
        sizeClass,
        c.bg,
        c.glow,
        c.ring,
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
        'disabled:opacity-30 disabled:pointer-events-none',
        className
      )}
    >
      <span className="leading-none">{emoji}</span>
      <span className="text-white text-xs font-bold uppercase tracking-wide leading-tight">{label}</span>
    </button>
  )
}
