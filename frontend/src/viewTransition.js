import { gsap } from 'gsap'
import { VIEWS } from './urlState'

// Tabs sit in this order on screen, so the grid slides toward the tab that was picked
const VIEW_ORDER = [VIEWS.all, VIEWS.favorites]
const NO_MOTION = 0
const ANIMATED_ITEMS = 12
const SLIDE_PX = 24
const EXIT_SECONDS = 0.18
const ENTER_SECONDS = 0.35
const ENTER_STAGGER_SECONDS = 0.02
const REDUCED_FADE_SECONDS = 0.15
const TWEEN_PROPS = 'opacity,transform'

export function viewDirection(from, to) {
  return Math.sign(VIEW_ORDER.indexOf(to) - VIEW_ORDER.indexOf(from))
}

// Only the first items move; the rest appear in place, which keeps long grids cheap
const animatedItems = (grid) => Array.from(grid.children).slice(0, ANIMATED_ITEMS)
// GSAP leaves inline styles behind; a card kept across the swap would otherwise stay invisible
const clearTweenStyles = (items) => gsap.set(items, { clearProps: TWEEN_PROPS })

function exitMotion(direction, reducedMotion) {
  if (reducedMotion) return { from: { opacity: 1 }, to: { opacity: 0, duration: REDUCED_FADE_SECONDS } }
  return { from: { opacity: 1, x: 0 }, to: { opacity: 0, x: -direction * SLIDE_PX, duration: EXIT_SECONDS } }
}

function enterMotion(direction, reducedMotion) {
  if (reducedMotion) {
    return { from: { opacity: 0 }, to: { opacity: 1, duration: REDUCED_FADE_SECONDS, clearProps: 'opacity' } }
  }
  return {
    from: { opacity: 0, x: direction * SLIDE_PX },
    to: { opacity: 1, x: 0, duration: ENTER_SECONDS, stagger: ENTER_STAGGER_SECONDS, clearProps: TWEEN_PROPS },
  }
}

// Resolves when the tween ends or when `signal` aborts (the tween is killed and the items reset at once)
function tween(items, { from, to }, signal) {
  if (items.length === 0 || signal?.aborted) return Promise.resolve()
  return new Promise((resolve) => {
    const animation = gsap.fromTo(items, from, { ...to, onComplete: resolve })
    signal?.addEventListener(
      'abort',
      () => {
        animation.kill()
        clearTweenStyles(items)
        resolve()
      },
      { once: true },
    )
  })
}

// Outgoing items slide against the direction and fade; `swap` changes the view and must commit the
// new items to the DOM before it returns (flushSync), then the incoming items slide in from the direction.
// An aborted `signal` (a newer switch, unmount) stops the transition and skips the swap.
// If the animation fails the view still changes and the inline styles are cleared.
export async function playViewTransition({ grid, direction, reducedMotion, swap, signal }) {
  if (direction === NO_MOTION) {
    swap()
    return
  }
  let swapped = false
  // Captured before the swap: the cards React keeps across it still carry the exit styles
  const outgoing = animatedItems(grid)
  const applySwap = () => {
    swapped = true
    swap()
    clearTweenStyles(outgoing)
  }
  try {
    await tween(outgoing, exitMotion(direction, reducedMotion), signal)
    if (signal?.aborted) return
    applySwap()
    await tween(animatedItems(grid), enterMotion(direction, reducedMotion), signal)
  } catch {
    clearTweenStyles([...outgoing, ...animatedItems(grid)])
    if (!swapped && !signal?.aborted) applySwap()
  }
}
