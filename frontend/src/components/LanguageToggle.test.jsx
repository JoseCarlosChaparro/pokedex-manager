import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { detectLanguage } from '../i18n'
import LanguageToggle from './LanguageToggle'

describe('LanguageToggle', () => {
  it('switches to English, updates <html lang> and persists', async () => {
    render(<LanguageToggle />)

    await userEvent.click(screen.getByRole('button', { name: 'English' }))

    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem('pokedex_lang')).toBe('en')
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true')
  })

  // The toggle sits on a dark wrapper in light mode, so its codes must not inherit the dark page text
  it('sets white text on the unpressed codes so they stay readable on the dark wrapper', () => {
    render(<LanguageToggle />)

    expect(screen.getByRole('button', { name: 'Español' })).toHaveClass('text-white')
    expect(screen.getByRole('button', { name: 'English' })).toHaveClass('text-white')
  })
})

describe('detectLanguage', () => {
  it('falls back to Spanish for an unknown saved language', () => {
    localStorage.setItem('pokedex_lang', 'fr')

    expect(detectLanguage(localStorage)).toBe('es')
  })

  it('falls back to Spanish when storage throws', () => {
    const blockedStorage = {
      getItem: () => {
        throw new DOMException('Storage is blocked', 'SecurityError')
      },
    }

    expect(detectLanguage(blockedStorage)).toBe('es')
  })

  it('returns a supported saved language', () => {
    localStorage.setItem('pokedex_lang', 'en')

    expect(detectLanguage(localStorage)).toBe('en')
  })
})
