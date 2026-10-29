import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import i18n from '../i18n'
import AppFooter from './AppFooter'

describe('AppFooter', () => {
  it('credits the author, PokéAPI and Nintendo, with the year and version', () => {
    render(<AppFooter year={2026} />)

    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByText('José Carlos Chaparro')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'PokéAPI' })).toHaveAttribute('href', 'https://pokeapi.co')
    expect(screen.getByRole('link', { name: /GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/JoseCarlosChaparro/pokedex-manager',
    )
    expect(screen.getByText(/Nintendo/)).toBeInTheDocument()
    expect(screen.getByText(/© 2026/)).toBeInTheDocument()
    expect(screen.getByText('v2')).toBeInTheDocument()
  })

  it('reads the fan-project disclaimer in English', async () => {
    await i18n.changeLanguage('en')

    render(<AppFooter year={2026} />)

    expect(screen.getByText(/fan project/)).toBeInTheDocument()
  })
})
