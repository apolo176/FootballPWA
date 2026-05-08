import { useSettingsStore } from '../store/settingsStore'

/**
 * Reads theme state from the global settingsStore so every component
 * (Home header toggle, Settings switch, etc.) stays in sync without
 * needing a React context or prop-drilling.
 *
 * The DOM class is applied once in App.jsx via a single useEffect that
 * subscribes to the store — this hook is purely a reader + action caller.
 */
export function useTheme() {
  const { theme, setTheme } = useSettingsStore()
  const dark = theme !== 'light'   // default to dark for any unset value

  return {
    dark,
    toggle: () => setTheme(dark ? 'light' : 'dark'),
  }
}
