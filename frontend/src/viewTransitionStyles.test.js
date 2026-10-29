import { describe, expect, it } from 'vitest'
import { playViewTransition } from './viewTransition'

// Real GSAP on purpose: the exit tween leaves inline styles behind, and only a real tween shows the leftover.
const newItems = (count) => Array.from({ length: count }, () => document.createElement('li'))

describe('playViewTransition leftover styles', () => {
  it('clears the exit styles of a card kept across the switch that lands past the animated items', async () => {
    // A favorite is in both views, so React keeps its element. It starts in the animated first 12 of the
    // outgoing grid, and after the swap it sits at position 15, where the enter tween does not touch it.
    const grid = document.createElement('ul')
    const kept = document.createElement('li')
    grid.append(kept, ...newItems(11))
    const swap = () => grid.replaceChildren(...newItems(14), kept)

    await playViewTransition({ grid, direction: 1, reducedMotion: false, swap })

    expect(kept.style.opacity).toBe('')
    expect(kept.style.transform).toBe('')
  })
})
