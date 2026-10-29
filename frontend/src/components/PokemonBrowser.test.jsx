import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PokemonBrowser from './PokemonBrowser'

vi.mock('../hooks/usePokedexIndex', () => ({
  usePokedexIndex: () => ({
    index: [{ id: 1, name: 'bulbasaur', types: ['grass'] }],
    isLoading: false,
    error: null,
  }),
}))

const favoritesState = vi.hoisted(() => ({ favorites: [], isLoading: false }))
vi.mock('../hooks/useFavorites', () => ({
  useFavorites: () => ({
    ...favoritesState,
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
    openPack: vi.fn(),
    error: null,
  }),
}))

describe('PokemonBrowser empty collection', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
    favoritesState.isLoading = false
  })

  // An empty collection has nothing to filter, so the filter card stays out of the way of the empty state
  it('hides the filters when the collection is empty', () => {
    window.history.replaceState(null, '', '/?view=favorites')
    render(<PokemonBrowser onUnauthorized={vi.fn()} playTransition={vi.fn()} />)

    expect(screen.getByText('Tu colección está vacía')).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  // Until the favorites arrive the collection is unknown: no empty state, no filters, and the requested page stays
  it('shows neither an empty state nor the filters while the collection loads', () => {
    favoritesState.isLoading = true
    window.history.replaceState(null, '', '/?view=favorites&page=2')
    render(<PokemonBrowser onUnauthorized={vi.fn()} playTransition={vi.fn()} />)

    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(window.location.search).toContain('page=2')
  })
})

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

describe('PokemonBrowser view switch races', () => {
  // The transition never settles on its own; each test drives the swaps it captured
  const deferredTransition = () => vi.fn(() => new Promise(() => {}))
  const requestsOf = (playTransition) => playTransition.mock.calls.map(([args]) => args)

  it('the last click wins during a transition', async () => {
    const playTransition = deferredTransition()
    render(<PokemonBrowser onUnauthorized={vi.fn()} playTransition={playTransition} />)

    await userEvent.click(screen.getByRole('button', { name: 'Mi colección (0)' }))
    await userEvent.click(screen.getByRole('button', { name: 'Pokédex' }))
    const [first, second] = requestsOf(playTransition)
    act(() => first.swap())

    expect(first.signal.aborted).toBe(true)
    expect(second.direction).toBe(-1)
    expect(window.location.search).not.toContain('view=favorites')

    act(() => second.swap())
    expect(screen.getByRole('button', { name: 'Pokédex' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('ignores a repeated click on the pending tab', async () => {
    const playTransition = deferredTransition()
    render(<PokemonBrowser onUnauthorized={vi.fn()} playTransition={playTransition} />)

    await userEvent.click(screen.getByRole('button', { name: 'Mi colección (0)' }))
    await userEvent.click(screen.getByRole('button', { name: 'Mi colección (0)' }))

    expect(playTransition).toHaveBeenCalledOnce()
  })

  it('selects the clicked tab before the grid has swapped', async () => {
    const playTransition = deferredTransition()
    render(<PokemonBrowser onUnauthorized={vi.fn()} playTransition={playTransition} />)

    await userEvent.click(screen.getByRole('button', { name: 'Mi colección (0)' }))

    expect(screen.getByRole('button', { name: 'Mi colección (0)' })).toHaveAttribute('aria-pressed', 'true')
    expect(window.location.search).not.toContain('view=favorites')
  })

  it('does not swap after unmount', async () => {
    const playTransition = deferredTransition()
    const { unmount } = render(<PokemonBrowser onUnauthorized={vi.fn()} playTransition={playTransition} />)
    await userEvent.click(screen.getByRole('button', { name: 'Mi colección (0)' }))
    const [request] = requestsOf(playTransition)

    unmount()
    act(() => request.swap())

    expect(request.signal.aborted).toBe(true)
    expect(window.location.search).not.toContain('view=favorites')
  })

  it('a Back navigation mid-transition wins over the pending swap', async () => {
    const playTransition = deferredTransition()
    render(<PokemonBrowser onUnauthorized={vi.fn()} playTransition={playTransition} />)
    await userEvent.click(screen.getByRole('button', { name: 'Mi colección (0)' }))
    const [request] = requestsOf(playTransition)

    act(() => {
      window.history.pushState(null, '', '/?view=all')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    act(() => request.swap())

    expect(request.signal.aborted).toBe(true)
    expect(screen.getByRole('button', { name: 'Pokédex' })).toHaveAttribute('aria-pressed', 'true')
    expect(window.location.search).not.toContain('view=favorites')
  })
})
