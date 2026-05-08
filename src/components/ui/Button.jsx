import { cn } from '../../lib/utils'

const variants = {
  primary: 'bg-emerald-500 hover:bg-emerald-600 text-white focus-visible:ring-emerald-500',
  danger:  'bg-red-500 hover:bg-red-600 text-white focus-visible:ring-red-500',
  warning: 'bg-amber-400 hover:bg-amber-500 text-slate-900 focus-visible:ring-amber-400',
  ghost:   'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white focus-visible:ring-white/40',
  outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 dark:border-white/20 dark:hover:bg-white/10 dark:text-white focus-visible:ring-white/40',
}

const sizes = {
  sm:    'h-9 px-3 text-sm rounded-xl gap-1.5',
  md:    'h-11 px-4 text-base rounded-xl gap-2',
  lg:    'h-14 px-6 text-lg rounded-2xl gap-2',
  xl:    'h-20 px-4 text-xl rounded-2xl gap-2',
  '2xl': 'h-24 px-4 text-2xl rounded-2xl gap-2',
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold',
        'select-none cursor-pointer active:scale-95',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
        'disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
