export const EVENT = {
  GOAL:         'goal',
  GOAL_AGAINST: 'goal_against',
  OWN_GOAL:     'own_goal',
  SHOT_ON:      'shot_on',
  SHOT_OFF:     'shot_off',
  DANGER:       'danger',      // Ocasión de Peligro / Dangerous Attack
  YELLOW:       'yellow',
  RED:          'red',
  SUB:          'sub',
  MATCH_START:  'match_start',
  HALF_TIME:    'half_time',
  SECOND_HALF:  'second_half',
  MATCH_END:    'match_end',
}

export const PHASE = { PRE: 'pre', LIVE: 'live', POST: 'post' }

export const POSITION = {
  GK:  { label: 'GK',  color: 'bg-amber-500'   },
  DEF: { label: 'DEF', color: 'bg-sky-500'      },
  MID: { label: 'MID', color: 'bg-emerald-500'  },
  FWD: { label: 'FWD', color: 'bg-red-500'      },
}

export const EVENT_META = {
  [EVENT.GOAL]:         { label: 'Goal',            emoji: '⚽', color: 'emerald', affects: 'home' },
  [EVENT.GOAL_AGAINST]: { label: 'Goal Against',    emoji: '😓', color: 'red',     affects: 'away' },
  [EVENT.OWN_GOAL]:     { label: 'Own Goal',        emoji: '🙈', color: 'orange',  affects: 'away' },
  [EVENT.SHOT_ON]:      { label: 'Shot On Target',  emoji: '🎯', color: 'sky',     affects: null },
  [EVENT.SHOT_OFF]:     { label: 'Shot Off Target', emoji: '↗️', color: 'slate',   affects: null },
  [EVENT.DANGER]:       { label: 'Danger Attack',   emoji: '⚡', color: 'orange',  affects: null },
  [EVENT.YELLOW]:       { label: 'Yellow Card',     emoji: '🟨', color: 'yellow',  affects: null },
  [EVENT.RED]:          { label: 'Red Card',        emoji: '🟥', color: 'red',     affects: null },
  [EVENT.SUB]:          { label: 'Substitution',    emoji: '🔄', color: 'violet',  affects: null },
  [EVENT.MATCH_START]:  { label: 'Kick Off',        emoji: '▶️', color: 'emerald', affects: null },
  [EVENT.HALF_TIME]:    { label: 'Half Time',       emoji: '⏸️', color: 'slate',   affects: null },
  [EVENT.SECOND_HALF]:  { label: '2nd Half',        emoji: '▶️', color: 'emerald', affects: null },
  [EVENT.MATCH_END]:    { label: 'Full Time',       emoji: '🏁', color: 'slate',   affects: null },
}

// Formation positions in SVG coordinate space: x 0-100 (left→right), y 0-65 (top→GK)
// CSS positioning: left=x%, top=(y/65*100)%
export const FORMATIONS = {
  '4-3-3': [
    { id: 'gk',  role: 'GK',  x: 50, y: 58 },
    { id: 'lb',  role: 'LB',  x: 12, y: 46 },
    { id: 'cb1', role: 'CB',  x: 35, y: 46 },
    { id: 'cb2', role: 'CB',  x: 65, y: 46 },
    { id: 'rb',  role: 'RB',  x: 88, y: 46 },
    { id: 'lcm', role: 'LCM', x: 22, y: 31 },
    { id: 'cm',  role: 'CM',  x: 50, y: 29 },
    { id: 'rcm', role: 'RCM', x: 78, y: 31 },
    { id: 'lw',  role: 'LW',  x: 16, y: 14 },
    { id: 'st',  role: 'ST',  x: 50, y: 9  },
    { id: 'rw',  role: 'RW',  x: 84, y: 14 },
  ],
  '4-4-2': [
    { id: 'gk',  role: 'GK',  x: 50, y: 58 },
    { id: 'lb',  role: 'LB',  x: 12, y: 46 },
    { id: 'cb1', role: 'CB',  x: 35, y: 46 },
    { id: 'cb2', role: 'CB',  x: 65, y: 46 },
    { id: 'rb',  role: 'RB',  x: 88, y: 46 },
    { id: 'lm',  role: 'LM',  x: 12, y: 31 },
    { id: 'cm1', role: 'CM',  x: 36, y: 31 },
    { id: 'cm2', role: 'CM',  x: 64, y: 31 },
    { id: 'rm',  role: 'RM',  x: 88, y: 31 },
    { id: 'st1', role: 'ST',  x: 35, y: 12 },
    { id: 'st2', role: 'ST',  x: 65, y: 12 },
  ],
  '4-2-3-1': [
    { id: 'gk',  role: 'GK',  x: 50, y: 58 },
    { id: 'lb',  role: 'LB',  x: 12, y: 46 },
    { id: 'cb1', role: 'CB',  x: 35, y: 46 },
    { id: 'cb2', role: 'CB',  x: 65, y: 46 },
    { id: 'rb',  role: 'RB',  x: 88, y: 46 },
    { id: 'dm1', role: 'DM',  x: 35, y: 36 },
    { id: 'dm2', role: 'DM',  x: 65, y: 36 },
    { id: 'lam', role: 'LAM', x: 16, y: 22 },
    { id: 'cam', role: 'CAM', x: 50, y: 20 },
    { id: 'ram', role: 'RAM', x: 84, y: 22 },
    { id: 'st',  role: 'ST',  x: 50, y: 9  },
  ],
  '3-5-2': [
    { id: 'gk',  role: 'GK',  x: 50, y: 58 },
    { id: 'cb1', role: 'CB',  x: 25, y: 46 },
    { id: 'cb2', role: 'CB',  x: 50, y: 46 },
    { id: 'cb3', role: 'CB',  x: 75, y: 46 },
    { id: 'lwb', role: 'LWB', x:  9, y: 33 },
    { id: 'cm1', role: 'CM',  x: 31, y: 31 },
    { id: 'cm2', role: 'CM',  x: 50, y: 29 },
    { id: 'cm3', role: 'CM',  x: 69, y: 31 },
    { id: 'rwb', role: 'RWB', x: 91, y: 33 },
    { id: 'st1', role: 'ST',  x: 35, y: 12 },
    { id: 'st2', role: 'ST',  x: 65, y: 12 },
  ],
}

export const FORMATION_NAMES = Object.keys(FORMATIONS)

export const YELLOW_REASONS = [
  'Falta Táctica',
  'Protestar',
  'Pérdida de Tiempo',
  'Mano',
  'Agarrón',
  'Conducta Antideportiva',
  'Entrar sin Permiso',
]

export const RED_REASONS = [
  'Juego Brusco Grave',
  'Agresión',
  'Último Hombre (DOGSO Falta)',
  'Último Hombre (DOGSO Mano)',
  'Doble Amarilla',
  'Insultos',
]
