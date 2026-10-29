import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ViewTabs from './ViewTabs'

const renderTabs = (props) =>
  render(<ViewTabs view="all" totalCount={1025} favoritesCount={3} sealedCount={0} onChange={vi.fn()} {...props} />)

describe('ViewTabs', () => {
  it('marks the current view and switches', async () => {
    const onChange = vi.fn()
    renderTabs({ onChange })

    expect(screen.getByRole('button', { name: 'Pokédex' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Mi colección (3)' })).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(screen.getByRole('button', { name: 'Mi colección (3)' }))
    expect(onChange).toHaveBeenCalledWith('favorites')
  })

  it('shows the sealed badge with an accessible text', () => {
    renderTabs({ sealedCount: 1 })

    expect(screen.getByText('1 sobre sin abrir')).toBeInTheDocument()
  })

  it('renders the view heading', () => {
    renderTabs()

    expect(screen.getByRole('heading', { level: 2, name: 'Pokédex' })).toBeInTheDocument()
  })
})
