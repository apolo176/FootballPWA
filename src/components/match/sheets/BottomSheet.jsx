import { cn } from '../../../lib/utils'

/**
 * Mobile-first bottom sheet that slides up from the screen edge.
 * Renders nothing when `open` is false — no portals needed since
 * z-50 sits above the z-40 bottom nav.
 */
export function BottomSheet({ open, onClose, title, children, tall = false }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={cn(
        'relative z-10 w-full bg-slate-900',
        'border-t border-slate-700/50 rounded-t-3xl shadow-2xl',
        'flex flex-col animate-slide-up',
        tall ? 'max-h-[88vh]' : 'max-h-[75vh]',
      )}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-slate-800/80 shrink-0">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
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
