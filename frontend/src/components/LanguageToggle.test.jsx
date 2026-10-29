import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { detectLanguage } from '../i18n'
import LanguageToggle from './LanguageToggle'

describe('LanguageToggle', () => {
  it('switches to English, updates <html lang> and persists', async () => {
    render(<LanguageToggle />)

    await userEvent.click(screen.getByRole('button', { name: /English/ }))

    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem('pokedex_lang')).toBe('en')
    expect(screen.getByRole('button', { name: /English/ })).toHaveAttribute('aria-pressed', 'true')
  })

  // WCAG 2.5.3 label in name: the visible code is part of the accessible name
  it('keeps the visible code inside each accessible name', () => {
    render(<LanguageToggle />)

    expect(screen.getByRole('button', { name: 'ES Español' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'EN English' })).toBeInTheDocument()
  })

  // Screen readers pronounce each full name in its own language
  it('marks each full name with its language', () => {
    render(<LanguageToggle />)

    expect(screen.getByRole('button', { name: 'ES Español' }).querySelector('[lang="es"]')).toHaveTextContent('Español')
    expect(screen.getByRole('button', { name: 'EN English' }).querySelector('[lang="en"]')).toHaveTextContent('English')
  })

  // The toggle sits on a dark wrapper in light mode, so its codes must not inherit the dark page text
  it('sets light text on the codes so they stay readable on the dark wrapper', () => {
    render(<LanguageToggle />)

    expect(screen.getByRole('button', { name: /Español/ })).toHaveClass('text-slate-400', 'aria-pressed:text-white')
    expect(screen.getByRole('button', { name: /English/ })).toHaveClass('text-slate-400', 'aria-pressed:text-white')
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
