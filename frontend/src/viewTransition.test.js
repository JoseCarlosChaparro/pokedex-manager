import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VIEWS } from './urlState'
import { gsap } from 'gsap'
import { playViewTransition, viewDirection } from './viewTransition'

vi.mock('gsap', () => ({ gsap: { fromTo: vi.fn(), set: vi.fn() } }))

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

describe('playViewTransition failures and aborts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('still applies the view when the animation fails', async () => {
    gsap.fromTo.mockImplementation(() => {
      throw new Error('animation failed')
    })
    const swap = vi.fn()

    await playViewTransition({ grid: gridWithItems(3), direction: 1, reducedMotion: false, swap })

    expect(swap).toHaveBeenCalledOnce()
    expect(gsap.set).toHaveBeenCalled()
  })

  it('skips the swap and kills the tween when aborted mid-exit', async () => {
    const kill = vi.fn()
    gsap.fromTo.mockImplementation(() => ({ kill }))
    const controller = new AbortController()
    const swap = vi.fn()

    const run = playViewTransition({ grid: gridWithItems(3), direction: 1, reducedMotion: false, swap, signal: controller.signal })
    controller.abort()
    await run

    expect(kill).toHaveBeenCalledOnce()
    expect(swap).not.toHaveBeenCalled()
  })
})

