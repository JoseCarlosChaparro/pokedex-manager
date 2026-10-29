import { describe, expect, it, vi } from 'vitest'
import { VIEWS } from './urlState'
import { playViewTransition, viewDirection } from './viewTransition'

const gridWithItems = (count) => {
  const grid = document.createElement('ul')
  for (let i = 0; i < count; i += 1) grid.append(document.createElement('li'))
  return grid
}

describe('viewDirection', () => {
  it('moves right from the Pokédex to the collection and left back', () => {
    expect(viewDirection(VIEWS.all, VIEWS.favorites)).toBe(1)
    expect(viewDirection(VIEWS.favorites, VIEWS.all)).toBe(-1)
  })

  it('does not move when the view stays the same', () => {
    expect(viewDirection(VIEWS.all, VIEWS.all)).toBe(0)
  })
})

// These cases never reach GSAP: a timeline is only built when there is a direction and items to move
describe('playViewTransition', () => {
  it('only swaps the view when there is no direction to animate', async () => {
    const swap = vi.fn()

    await playViewTransition({ grid: gridWithItems(3), direction: 0, reducedMotion: false, swap })

    expect(swap).toHaveBeenCalledOnce()
  })

  it('swaps straight away when the grid has no items', async () => {
    const swap = vi.fn()

    await playViewTransition({ grid: gridWithItems(0), direction: 1, reducedMotion: false, swap })

    expect(swap).toHaveBeenCalledOnce()
  })
})
