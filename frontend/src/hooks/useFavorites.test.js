import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest } from '../api'
import { useFavorites } from './useFavorites'

vi.mock('../api', async (importOriginal) => ({ ...(await importOriginal()), apiRequest: vi.fn() }))

const PIKACHU = { id: 25, name: 'pikachu' }

describe('useFavorites', () => {
  beforeEach(() => {
    apiRequest.mockReset()
  })

  it('loads the saved favorites', async () => {
    apiRequest.mockResolvedValueOnce([{ pokemon_id: 25, name: 'pikachu', added_at: '2026-10-28T00:00:00Z' }])

    const { result } = renderHook(() => useFavorites({ onUnauthorized: vi.fn() }))

    await waitFor(() => expect(result.current.isFavorite(25)).toBe(true))
    expect(result.current.favorites).toEqual([{ ...PIKACHU, opened: false }])
  })

  it('adds a favorite optimistically', async () => {
    apiRequest.mockResolvedValueOnce([]).mockReturnValueOnce(new Promise(() => {}))
    const { result } = renderHook(() => useFavorites({ onUnauthorized: vi.fn() }))
    await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(1))

    act(() => {
      result.current.toggleFavorite(PIKACHU)
    })

    expect(result.current.isFavorite(25)).toBe(true)
    expect(apiRequest).toHaveBeenLastCalledWith('/api/me/favorites/25', { method: 'PUT' })
  })

  it('rolls back when the server rejects the change', async () => {
    apiRequest.mockResolvedValueOnce([]).mockRejectedValueOnce(new ApiError(502, 'down'))
    const { result } = renderHook(() => useFavorites({ onUnauthorized: vi.fn() }))
    await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(1))

    await act(() => result.current.toggleFavorite(PIKACHU))

    expect(result.current.isFavorite(25)).toBe(false)
    expect(result.current.error).toMatch(/no pudimos/i)
  })

  it('removes a favorite', async () => {
    apiRequest.mockResolvedValueOnce([{ pokemon_id: 25, name: 'pikachu' }]).mockResolvedValueOnce(null)
    const { result } = renderHook(() => useFavorites({ onUnauthorized: vi.fn() }))
    await waitFor(() => expect(result.current.isFavorite(25)).toBe(true))

    await act(() => result.current.toggleFavorite(PIKACHU))

    expect(result.current.isFavorite(25)).toBe(false)
    expect(apiRequest).toHaveBeenLastCalledWith('/api/me/favorites/25', { method: 'DELETE' })
  })

  it('opens a sealed pack', async () => {
    apiRequest.mockResolvedValueOnce([{ pokemon_id: 25, name: 'pikachu', opened: false }]).mockResolvedValueOnce({})
    const { result } = renderHook(() => useFavorites({ onUnauthorized: vi.fn() }))
    await waitFor(() => expect(result.current.isFavorite(25)).toBe(true))

    await act(() => result.current.openPack(PIKACHU))

    expect(result.current.favorites[0].opened).toBe(true)
    expect(apiRequest).toHaveBeenLastCalledWith('/api/me/favorites/25/open', { method: 'POST' })
  })

  it('ends the session on 401', async () => {
    const onUnauthorized = vi.fn()
    apiRequest.mockRejectedValueOnce(new ApiError(401, 'expired'))

    renderHook(() => useFavorites({ onUnauthorized }))

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled())
  })
})
