import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useUrlState } from './useUrlState'

describe('useUrlState', () => {
  it('starts from the current URL', () => {
    window.history.replaceState(null, '', '/?page=2&type=fire')

    const { result } = renderHook(() => useUrlState())

    expect(result.current[0]).toMatchObject({ page: 2, type: 'fire' })
  })

  it('pushes one history entry per update', () => {
    const { result } = renderHook(() => useUrlState())
    const before = window.history.length

    act(() => result.current[1]({ pokemon: '25' }))

    expect(window.location.search).toBe('?pokemon=25')
    expect(window.history.length).toBe(before + 1)
  })

  it('follows the Back button', () => {
    const { result } = renderHook(() => useUrlState())
    act(() => result.current[1]({ pokemon: '25' }))

    act(() => {
      window.history.replaceState(null, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(result.current[0].pokemon).toBeNull()
  })
})
