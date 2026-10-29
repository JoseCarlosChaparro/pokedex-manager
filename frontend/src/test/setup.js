import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import i18n from '../i18n'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  // Before clearing storage: changing the language persists it, and the tests start from Spanish
  i18n.changeLanguage('es')
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  window.history.replaceState(null, '', '/')
})

// jsdom has no matchMedia; default to "no reduced-motion preference"
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}
