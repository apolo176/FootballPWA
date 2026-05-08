/** Reusable CSS/SVG football pitch background.
 *  viewBox 0 0 100 65 — coordinates match formation slot positions. */
export function PitchSVG() {
  const line = 'rgba(255,255,255,0.75)'
  const sw   = 0.55

  return (
    <svg
      viewBox="0 0 100 65"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      {/* Pitch stripes */}
      {[0,10,20,30,40,50,60,70,80,90].map((x, i) =>
        i % 2 === 0
          ? <rect key={x} x={x} y={0} width={10} height={65} fill="rgba(0,0,0,0.07)" />
          : null
      )}

      {/* Outer boundary */}
      <rect x="2" y="2" width="96" height="61" fill="none" stroke={line} strokeWidth={sw} />

      {/* Center line */}
      <line x1="2" y1="32.5" x2="98" y2="32.5" stroke={line} strokeWidth={sw} />

      {/* Center circle (will be elliptical due to non-square aspect — intentional) */}
      <ellipse cx="50" cy="32.5" rx="9" ry="9" fill="none" stroke={line} strokeWidth={sw} />
      <circle  cx="50" cy="32.5" r="0.8" fill={line} />

      {/* Penalty area — attacking end (top) */}
      <rect x="27" y="2"  width="46" height="14" fill="none" stroke={line} strokeWidth={sw} />
      {/* Goal area — top */}
      <rect x="38" y="2"  width="24" height="5"  fill="none" stroke={line} strokeWidth={sw} />
      {/* Penalty spot — top */}
      <circle cx="50" cy="13" r="0.7" fill={line} />

      {/* Penalty area — defensive end (bottom) */}
      <rect x="27" y="49" width="46" height="14" fill="none" stroke={line} strokeWidth={sw} />
      {/* Goal area — bottom */}
      <rect x="38" y="58" width="24" height="5"  fill="none" stroke={line} strokeWidth={sw} />
      {/* Penalty spot — bottom */}
      <circle cx="50" cy="52" r="0.7" fill={line} />

      {/* Goals */}
      <rect x="43" y="63" width="14" height="2" fill="none" stroke={line} strokeWidth={sw} />
      <rect x="43" y="0"  width="14" height="2" fill="none" stroke={line} strokeWidth={sw} />

      {/* Corner arcs */}
      <path d="M2,4 Q4,2 4,2"  fill="none" stroke={line} strokeWidth={sw} />
      <path d="M96,4 Q98,2 98,2" fill="none" stroke={line} strokeWidth={sw} />
    </svg>
  )
}
