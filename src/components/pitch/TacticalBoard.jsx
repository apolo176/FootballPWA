import { useRef, useCallback } from 'react'
import { PitchSVG } from './PitchSVG'
import { generateId } from '../../lib/utils'
import { cn } from '../../lib/utils'

const TOKEN_TYPES = [
  { type: 'player',   label: '👤', bg: 'bg-sky-500',    desc: 'Player'   },
  { type: 'opponent', label: '🔴', bg: 'bg-red-500',    desc: 'Opponent' },
  { type: 'cone',     label: '🟠', bg: 'bg-orange-500', desc: 'Cone'     },
  { type: 'ball',     label: '⚪', bg: 'bg-white',      desc: 'Ball'     },
]

const TOKEN_STYLE = {
  player:   { bg: 'bg-sky-500',    text: 'text-white',     size: 'w-7 h-7' },
  opponent: { bg: 'bg-red-500',    text: 'text-white',     size: 'w-7 h-7' },
  cone:     { bg: 'bg-orange-400', text: 'text-slate-900', size: 'w-5 h-5' },
  ball:     { bg: 'bg-white',      text: 'text-slate-800', size: 'w-5 h-5' },
}

function Token({ token, onPointerDown, onDoubleClick }) {
  const s = TOKEN_STYLE[token.type] ?? TOKEN_STYLE.player

  return (
    <div
      className={cn(
        'absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing',
        'rounded-full flex items-center justify-center',
        'select-none touch-none shadow-md text-xs font-black',
        s.bg, s.text, s.size,
      )}
      style={{ left: `${token.x}%`, top: `${token.y}%` }}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
    >
      {token.label ?? ''}
    </div>
  )
}

/**
 * Free-form tactical board using raw pointer events.
 * Tokens are positioned as percentages of the pitch container.
 *
 * Props:
 *   tokens        — array of { id, type, x, y, label? }
 *   onTokensChange — (newTokens) => void
 */
export function TacticalBoard({ tokens, onTokensChange }) {
  const pitchRef  = useRef(null)
  const dragging  = useRef(null)   // { id, ox, oy } — offset from token center to pointer

  // Add a token at pitch center when a palette button is clicked
  const addToken = useCallback((type) => {
    const playerIndex = tokens.filter(t => t.type === 'player').length
    const oppIndex    = tokens.filter(t => t.type === 'opponent').length
    const label = type === 'player'
      ? String.fromCharCode(65 + playerIndex)    // A, B, C …
      : type === 'opponent'
        ? String.fromCharCode(49 + oppIndex)     // 1, 2, 3 …
        : undefined

    onTokensChange([
      ...tokens,
      { id: generateId(), type, label, x: 50, y: 50 },
    ])
  }, [tokens, onTokensChange])

  // Pointer events on each token
  const onTokenPointerDown = useCallback((e, token) => {
    e.stopPropagation()
    if (!pitchRef.current) return

    const rect = pitchRef.current.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * 100
    const py = ((e.clientY - rect.top)  / rect.height) * 100

    dragging.current = { id: token.id, ox: px - token.x, oy: py - token.y }
    pitchRef.current.setPointerCapture(e.pointerId)
  }, [])

  const onPitchPointerMove = useCallback((e) => {
    if (!dragging.current || !pitchRef.current) return
    const rect = pitchRef.current.getBoundingClientRect()
    const { id, ox, oy } = dragging.current

    const x = Math.max(1, Math.min(99, ((e.clientX - rect.left) / rect.width)  * 100 - ox))
    const y = Math.max(1, Math.min(99, ((e.clientY - rect.top)  / rect.height) * 100 - oy))

    // Functional update avoids stale closure on tokens
    onTokensChange(prev => prev.map(t => t.id === id ? { ...t, x, y } : t))
  }, [onTokensChange])

  const onPitchPointerUp = useCallback(() => {
    dragging.current = null
  }, [])

  const removeToken = useCallback((id) => {
    onTokensChange(prev => prev.filter(t => t.id !== id))
  }, [onTokensChange])

  return (
    <div className="space-y-3">
      {/* Palette */}
      <div className="flex gap-2 flex-wrap">
        {TOKEN_TYPES.map(({ type, label, desc }) => (
          <button
            key={type}
            onClick={() => addToken(type)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold hover:bg-slate-700 active:scale-95 transition-all"
          >
            <span>{label}</span>
            <span className="text-slate-400">{desc}</span>
          </button>
        ))}
        {tokens.length > 0 && (
          <button
            onClick={() => onTokensChange([])}
            className="ml-auto px-3 py-2 rounded-xl bg-slate-800 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/10 active:scale-95 transition-all"
          >
            Clear
          </button>
        )}
      </div>

      {/* Pitch */}
      <div
        ref={pitchRef}
        className="relative w-full rounded-xl overflow-hidden bg-emerald-800 touch-none"
        style={{ aspectRatio: '100 / 65' }}
        onPointerMove={onPitchPointerMove}
        onPointerUp={onPitchPointerUp}
      >
        <PitchSVG />

        {tokens.map(token => (
          <Token
            key={token.id}
            token={token}
            onPointerDown={(e) => onTokenPointerDown(e, token)}
            onDoubleClick={() => removeToken(token.id)}
          />
        ))}
      </div>

      <p className="text-[10px] text-slate-600 text-center">
        Drag tokens to position · Double-tap to remove
      </p>
    </div>
  )
}
