import { cn } from '../../../lib/utils'

export function BottomSheet({ open, onClose, title, children, tall = false }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className={cn(
        'relative z-10 w-full',
        'bg-white dark:bg-slate-900',
        'border-t border-slate-200 dark:border-slate-700/50',
        'rounded-t-3xl shadow-2xl flex flex-col animate-slide-up',
        tall ? 'max-h-[88vh]' : 'max-h-[75vh]',
      )}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto no-scrollbar overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )
}
