import { useEffect, useState } from 'react'

export const THEME_STORAGE_KEY = 'pokedex_theme'
export const THEMES = ['system', 'light', 'dark']
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return THEMES.includes(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}

// Same rule as the inline script in index.html, which applies it before the first paint (no flash)
function applyTheme(theme) {
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia(DARK_QUERY).matches)
  document.documentElement.classList.toggle('dark', isDark)
}

export function useTheme() {
  const [theme, setTheme] = useState(readSavedTheme)

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Storage can be blocked (private mode); the theme still applies for this visit
    }
    if (theme !== 'system') return undefined
    const media = window.matchMedia(DARK_QUERY)
    const handleChange = () => applyTheme('system')
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [theme])

  return [theme, setTheme]
}
