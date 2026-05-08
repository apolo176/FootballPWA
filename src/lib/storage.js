// Thin wrapper — Zustand's persist middleware handles all actual storage.
// This module exists as a seam for future IndexedDB migration if needed.
export const STORAGE_KEYS = {
  MATCHES: 'football-dss-matches',
  ROSTER: 'football-dss-roster',
  THEME: 'football-dss-theme',
}

export function clearAll() {
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k))
}
