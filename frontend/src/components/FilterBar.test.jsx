import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import i18n from '../i18n'
import FilterBar from './FilterBar'

const NO_FILTERS = { q: '', types: [], gen: '', sort: 'id', density: 'comfy' }

// jsdom does not load Tailwind, so "hidden" means the class (or attribute) is present on an ancestor
function isHidden(element) {
  return element.closest('.hidden, [hidden]') !== null
}

describe('FilterBar', () => {
  it('collapses into a toggle that shows the active filter count', async () => {
    render(<FilterBar filters={{ ...NO_FILTERS, types: ['fire'], gen: '1' }} resultCount={12} onChange={vi.fn()} />)
    const toggle = screen.getByRole('button', { name: /Filtros.*2/ })
    const search = screen.getByRole('searchbox', { name: 'Buscar Pokémon' })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(isHidden(search)).toBe(true)

    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(isHidden(search)).toBe(false)
    expect(toggle).toHaveFocus()
  })

  it('expands the collapsed filters when the / shortcut focuses the search', async () => {
    render(<FilterBar filters={NO_FILTERS} resultCount={151} onChange={vi.fn()} />)

    await userEvent.keyboard('/')

    expect(screen.getByRole('button', { name: /Filtros/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('searchbox', { name: 'Buscar Pokémon' })).toHaveFocus()
  })

  it('has headed sections for search, generation, sort, size and types', () => {
    render(<FilterBar filters={NO_FILTERS} resultCount={151} onChange={vi.fn()} />)
    const card = screen.getByRole('region', { name: 'Filtros' })

    expect(within(card).getByRole('heading', { name: 'Filtros' })).toBeInTheDocument()
    expect(within(card).getByRole('searchbox', { name: 'Buscar Pokémon' })).toBeInTheDocument()
    for (const heading of ['Generación', 'Ordenar', 'Tamaño de las tarjetas', 'Filtrar por tipo']) {
      expect(within(card).getByRole('heading', { name: heading })).toBeInTheDocument()
    }
  })

  it('follows the language', async () => {
    await i18n.changeLanguage('en')
    render(<FilterBar filters={NO_FILTERS} resultCount={1025} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Fire' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Name A–Z' })).toBeInTheDocument()
    // The count is shown twice: visibly, and in the debounced live region for screen readers
    expect(screen.getAllByText('1,025 Pokémon')[0]).toBeVisible()
  })
})
