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

export function viewDirection(from, to) {
  return Math.sign(VIEW_ORDER.indexOf(to) - VIEW_ORDER.indexOf(from))
}

// Only the first items move; the rest appear in place, which keeps long grids cheap
const animatedItems = (grid) => Array.from(grid.children).slice(0, ANIMATED_ITEMS)

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
    to: { opacity: 1, x: 0, duration: ENTER_SECONDS, stagger: ENTER_STAGGER_SECONDS, clearProps: 'opacity,transform' },
  }
}

function tween(targets, { from, to }) {
  if (targets.length === 0) return Promise.resolve()
  return new Promise((resolve) => {
    gsap.fromTo(targets, from, { ...to, onComplete: resolve })
  })
}

// Outgoing items slide against the direction and fade; `swap` changes the view and must commit the
// new items to the DOM before it returns (flushSync), then the incoming items slide in from the direction.
export async function playViewTransition({ grid, direction, reducedMotion, swap }) {
  if (direction === NO_MOTION) {
    swap()
    return
  }
  await tween(animatedItems(grid), exitMotion(direction, reducedMotion))
  swap()
  await tween(animatedItems(grid), enterMotion(direction, reducedMotion))
}
