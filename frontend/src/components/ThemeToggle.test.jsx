import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ThemeToggle from './ThemeToggle'

const EMOJI_ICON_PATTERN = /\p{Extended_Pictographic}/u

describe('ThemeToggle', () => {
  it('renders an icon per theme, hidden from assistive tech, and keeps the labels', () => {
    const onChange = vi.fn()
    const { container } = render(<ThemeToggle theme="dark" onChange={onChange} />)

    expect(screen.getByRole('button', { name: 'Tema claro' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tema del sistema' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tema oscuro' })).toHaveAttribute('aria-pressed', 'true')

    const icons = container.querySelectorAll('button svg')
    expect(icons).toHaveLength(3)
    icons.forEach((icon) => expect(icon).toHaveAttribute('aria-hidden', 'true'))

    expect(container.textContent).not.toMatch(EMOJI_ICON_PATTERN)
  })
})
