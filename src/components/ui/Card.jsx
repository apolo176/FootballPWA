import { cn } from '../../lib/utils'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800/60',
        'border border-slate-200 dark:border-slate-700/50',
        'rounded-2xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return <div className={cn('px-4 pt-4 pb-2', className)}>{children}</div>
}

export function CardBody({ className, children }) {
  return <div className={cn('px-4 pb-4', className)}>{children}</div>
}
