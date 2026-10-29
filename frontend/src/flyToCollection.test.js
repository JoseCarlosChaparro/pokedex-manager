import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { throwPokeBall } from './flyToCollection'

const REDUCED_MOTION = { matches: true, addEventListener: () => {}, removeEventListener: () => {} }
const NO_PREFERENCE = { matches: false, addEventListener: () => {}, removeEventListener: () => {} }

// A rect fully inside jsdom's default 1024x768 viewport
const IN_VIEWPORT = { left: 100, top: 100, right: 140, bottom: 140, width: 40, height: 40, x: 100, y: 100 }

function elementWithRect(rect) {
  const element = document.createElement('div')
  element.getBoundingClientRect = () => rect
  document.body.append(element)
  return element
}

describe('throwPokeBall', () => {
  beforeEach(() => {
    // jsdom has no Web Animations API; the throw must not reach it when it should stay still
    Element.prototype.animate = vi.fn(() => ({ finished: new Promise(() => {}) }))
    vi.spyOn(window, 'matchMedia').mockReturnValue(NO_PREFERENCE)
  })

  afterEach(() => {
    delete Element.prototype.animate
    document.body.replaceChildren()
  })

  it('resolves immediately and adds nothing under reduced motion', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(REDUCED_MOTION)
    const source = elementWithRect(IN_VIEWPORT)
    const target = elementWithRect(IN_VIEWPORT)

    await throwPokeBall(source, target)

    expect(Element.prototype.animate).not.toHaveBeenCalled()
    expect(document.querySelector('.pokeball-throw')).toBeNull()
  })

  it('resolves immediately when there is no target', async () => {
    const source = elementWithRect(IN_VIEWPORT)

    await throwPokeBall(source, null)

    expect(Element.prototype.animate).not.toHaveBeenCalled()
    expect(document.querySelector('.pokeball-throw')).toBeNull()
  })

  it('removes the ball when the flight is cancelled', async () => {
    Element.prototype.animate = vi.fn(() => ({ finished: Promise.reject(new DOMException('cancelled', 'AbortError')) }))
    const source = elementWithRect(IN_VIEWPORT)
    const target = elementWithRect(IN_VIEWPORT)

    await throwPokeBall(source, target)

    expect(document.querySelector('.pokeball-throw')).toBeNull()
  })
})
