import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EmptyState from './EmptyState'

describe('EmptyState', () => {
  it('collection variant offers to explore the Pokédex', async () => {
    const onAction = vi.fn()
    render(<EmptyState variant="collection" onAction={onAction} />)

    expect(screen.getByRole('heading', { level: 3, name: 'Tu colección está vacía' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Explorar la Pokédex' }))

    expect(onAction).toHaveBeenCalledOnce()
  })

  it('noResults variant offers to clear the filters', async () => {
    const onAction = vi.fn()
    render(<EmptyState variant="noResults" onAction={onAction} />)

    expect(screen.getByRole('heading', { level: 3, name: 'Sin coincidencias' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    expect(onAction).toHaveBeenCalledOnce()
  })
})
