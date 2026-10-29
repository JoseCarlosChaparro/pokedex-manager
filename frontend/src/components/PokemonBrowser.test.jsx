import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PokemonBrowser from './PokemonBrowser'

vi.mock('../hooks/usePokedexIndex', () => ({
  usePokedexIndex: () => ({
    index: [{ id: 1, name: 'bulbasaur', types: ['grass'] }],
    isLoading: false,
    error: null,
  }),
}))

vi.mock('../hooks/useFavorites', () => ({
  useFavorites: () => ({
    favorites: [],
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
    openPack: vi.fn(),
    error: null,
  }),
}))

describe('PokemonBrowser view switch', () => {
  it('plays the grid transition toward the collection and then switches the view', async () => {
    // The injected transition runs the swap it is given, as the real one does between its two halves
    const playTransition = vi.fn(async ({ swap }) => swap())
    render(<PokemonBrowser onUnauthorized={vi.fn()} playTransition={playTransition} />)

    await userEvent.click(screen.getByRole('button', { name: 'Mi colección (0)' }))

    expect(playTransition).toHaveBeenCalledWith(expect.objectContaining({ direction: 1 }))
    expect(window.location.search).toContain('view=favorites')
  })
})
