import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTilt } from './useTilt'

function TiltSurface() {
  const { ref, onPointerMove, onPointerLeave } = useTilt()
  return (
    <div ref={ref} data-testid="surface" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <button type="button">Anterior</button>
    </div>
  )
}

const SQUARE_100 = { left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 }

function renderSurface() {
  render(<TiltSurface />)
  const surface = screen.getByTestId('surface')
  vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue(SQUARE_100)
  return surface
}

describe('useTilt', () => {
  it('tilts toward the pointer', () => {
    const surface = renderSurface()

    fireEvent.pointerMove(surface, { clientX: 100, clientY: 50 })

    expect(surface.style.getPropertyValue('--ry')).toBe('8deg')
    expect(surface.style.getPropertyValue('--rx')).toBe('0deg')
    expect(surface).toHaveAttribute('data-active')
  })

  it('freezes over buttons', () => {
    const surface = renderSurface()
    fireEvent.pointerMove(surface, { clientX: 100, clientY: 50 })

    fireEvent.pointerMove(screen.getByRole('button'), { clientX: 10, clientY: 10 })
    expect(surface.style.getPropertyValue('--ry')).toBe('8deg')

    fireEvent.pointerMove(surface, { clientX: 0, clientY: 50 })
    expect(surface.style.getPropertyValue('--ry')).toBe('-8deg')
  })

  it('stays still under reduced motion', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    const surface = renderSurface()

    fireEvent.pointerMove(surface, { clientX: 100, clientY: 50 })

    expect(surface.style.getPropertyValue('--rx')).toBe('')
    expect(surface).not.toHaveAttribute('data-active')
  })

  it('resets on leave', () => {
    const surface = renderSurface()
    fireEvent.pointerMove(surface, { clientX: 100, clientY: 50 })

    fireEvent.pointerLeave(surface)

    expect(surface).not.toHaveAttribute('data-active')
    expect(surface.style.getPropertyValue('--shine')).toBe('0.35')
  })
})
