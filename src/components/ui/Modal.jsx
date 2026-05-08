import { cn } from '../../lib/utils'

// No body-overflow side effects — the app layout uses container-based scrolling
// (page-container has overflow-y-auto). Manipulating document.body.style.overflow
// fights the CSS rule and can permanently lock scroll if cleanup misfires.
export function Modal({ open, onClose, title, children, className }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className={cn(
        'relative z-10 w-full sm:max-w-md bg-slate-900 border border-slate-700/60',
        'rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up sm:animate-scale-in',
        className
      )}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
