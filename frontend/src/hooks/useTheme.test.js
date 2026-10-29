import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { THEME_STORAGE_KEY, useTheme } from './useTheme'

describe('useTheme', () => {
  it('follows the system by default', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current[0]).toBe('system')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('applies and remembers an explicit choice', () => {
    const { result } = renderHook(() => useTheme())

    act(() => result.current[1]('dark'))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    act(() => result.current[1]('light'))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('starts from the saved choice', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')

    const { result } = renderHook(() => useTheme())

    expect(result.current[0]).toBe('dark')
  })
})
