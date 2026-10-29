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
const setOpened = (id, opened) => {
  collection.favorites = collection.favorites.map((f) => (f.id === id ? { ...f, opened } : f))
}
const announcement = () => screen.queryByText(/se unió a tu colección/)

// The server answers later, as in the browser: the test decides when and how. Like useFavorites.openPack,
// the pack shows as opened at once and reverts when the server rejects it.
function pendingOpening() {
  const answer = {}
  collection.openPack = vi.fn((pokemon) => {
    setOpened(pokemon.id, true)
    return new Promise((resolve) => {
      answer.accept = () => resolve(true)
      answer.reject = () => {
        setOpened(pokemon.id, false)
        resolve(false)
      }
    })
  })
  return answer
}

describe('PokemonBrowser pack reveal', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?view=favorites')
    collection.favorites = [{ id: 25, name: 'pikachu', opened: false }]
    collection.isLoading = false
    collection.openPack = vi.fn(async (pokemon) => {
      setOpened(pokemon.id, true)
      return true
    })
    packMock.restoreFocus = false
  })

  it('reveals the card without replaying its entrance animation', () => {
    render(<PokemonBrowser onUnauthorized={vi.fn()} playTransition={vi.fn()} />)

    act(() => openPackButton().click())

    expect(revealedCard()).not.toHaveClass('card-enter')
  })

  describe('when the server answers the opening', () => {
    it('does not announce the pack before the server accepts it', async () => {
      pendingOpening()
      render(<PokemonBrowser onUnauthorized={vi.fn()} playTransition={vi.fn()} />)

      act(() => openPackButton().click())

      expect(announcement()).not.toBeInTheDocument()
    })

    it('announces the pack once the server accepts it', async () => {
      const answer = pendingOpening()
      render(<PokemonBrowser onUnauthorized={vi.fn()} playTransition={vi.fn()} />)
      act(() => openPackButton().click())

      await act(async () => answer.accept())

      expect(announcement()).toBeInTheDocument()
    })

    it('does not announce a pack the server rejects', async () => {
      const answer = pendingOpening()
      render(<PokemonBrowser onUnauthorized={vi.fn()} playTransition={vi.fn()} />)
      act(() => openPackButton().click())

      await act(async () => answer.reject())

      expect(announcement()).not.toBeInTheDocument()
    })

    it('keeps focus off the card until a keyboard opening is accepted, then moves it there', async () => {
      packMock.restoreFocus = true
      const answer = pendingOpening()
      render(<PokemonBrowser onUnauthorized={vi.fn()} playTransition={vi.fn()} />)
      act(() => openPackButton().click())
      expect(document.activeElement).toBe(document.body)

      await act(async () => answer.accept())

      expect(revealedCard().querySelector('button')).toHaveFocus()
    })

    it('puts focus back on the sealed pack when a keyboard opening is rejected', async () => {
      packMock.restoreFocus = true
      const answer = pendingOpening()
      render(<PokemonBrowser onUnauthorized={vi.fn()} playTransition={vi.fn()} />)
      act(() => openPackButton().click())

      await act(async () => answer.reject())

      expect(openPackButton()).toHaveFocus()
    })
  })
})
