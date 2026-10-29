import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PokemonBrowser from './PokemonBrowser'

// The collection and the pack are fakes: the browser reads them through these hoisted objects
const collection = vi.hoisted(() => ({ favorites: [], isLoading: false, openPack: null }))
const packMock = vi.hoisted(() => ({ restoreFocus: false }))

vi.mock('../hooks/usePokedexIndex', () => ({
  usePokedexIndex: () => ({ index: [{ id: 25, name: 'pikachu', types: ['electric'] }], isLoading: false, error: null }),
}))

vi.mock('../hooks/useFavorites', () => ({
  useFavorites: () => ({
    favorites: collection.favorites,
    isLoading: collection.isLoading,
    isFavorite: (id) => collection.favorites.some((favorite) => favorite.id === Number(id)),
    toggleFavorite: vi.fn(),
    openPack: collection.openPack,
    error: null,
  }),
}))

// A stand-in for the sealed pack: one button that opens it, as a click or a keyboard press does
vi.mock('./BoosterPack', async () => {
  const { createElement } = await import('react')
  return {
    default: ({ pokemon, onOpen }) =>
      createElement(
        'li',
        { 'data-pokemon-id': pokemon.id },
        createElement(
          'button',
          { type: 'button', onClick: () => onOpen(pokemon, { restoreFocus: packMock.restoreFocus }) },
          `Abrir ${pokemon.name}`,
        ),
      ),
  }
})

const openPackButton = () => screen.getByRole('button', { name: 'Abrir pikachu' })
const revealedCard = () => document.querySelector('[data-pokemon-id="25"]')

describe('PokemonBrowser pack reveal', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?view=favorites')
    collection.favorites = [{ id: 25, name: 'pikachu', opened: false }]
    collection.isLoading = false
    collection.openPack = vi.fn(async (pokemon) => {
      collection.favorites = collection.favorites.map((f) => (f.id === pokemon.id ? { ...f, opened: true } : f))
      return true
    })
    packMock.restoreFocus = false
  })

  it('reveals the card without replaying its entrance animation', () => {
    render(<PokemonBrowser onUnauthorized={vi.fn()} playTransition={vi.fn()} />)

    act(() => openPackButton().click())

    expect(revealedCard()).not.toHaveClass('card-enter')
  })
})
