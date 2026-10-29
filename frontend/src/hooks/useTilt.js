import { useRef } from 'react'
import { prefersReducedMotion } from '../motion'

export const DEFAULT_MAX_DEGREES = 8
export const ACTIVE_SHINE = 1
const RESTING_SHINE = 0.35
const CENTER = 0.5
// How far the foil gradients slide as the surface tilts (percent of the background)
const FOIL_TRAVEL_PERCENT = 40
const TOUCH_POINTER_TYPE = 'touch'
const CONTROL_SELECTOR = 'button'

// Writes the light position and the tilt angles as CSS variables. x, y in 0..1: where the light hits.
export function writeTilt(element, { x, y, shine, maxDegrees = DEFAULT_MAX_DEGREES }) {
  if (!element) return
  const variables = {
    '--rx': `${(CENTER - y) * 2 * maxDegrees}deg`,
    '--ry': `${(x - CENTER) * 2 * maxDegrees}deg`,
    '--mx': `${x * 100}%`,
    '--my': `${y * 100}%`,
    '--bgx': `${50 + (x - CENTER) * FOIL_TRAVEL_PERCENT}%`,
    '--bgy': `${50 + (y - CENTER) * FOIL_TRAVEL_PERCENT}%`,
    '--shine': shine,
  }
  for (const [name, value] of Object.entries(variables)) element.style.setProperty(name, value)
}

const isOverControl = (target) => Boolean(target.closest(CONTROL_SELECTOR))

// Pointer tilt for a surface: the light follows the pointer and the surface resets on leave.
// Writes CSS variables directly (no React re-render per move). Freezes while the pointer is over a
// button, so a control under the cursor never moves; no-op for touch and under reduced motion.
export function useTilt({ maxDegrees = DEFAULT_MAX_DEGREES } = {}) {
  const ref = useRef(null)

  function onPointerMove(event) {
    if (prefersReducedMotion() || event.pointerType === TOUCH_POINTER_TYPE) return
    const element = ref.current
    if (!element) return
    element.dataset.active = ''
    if (isOverControl(event.target)) return
    const rect = element.getBoundingClientRect()
    writeTilt(element, {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
      shine: ACTIVE_SHINE,
      maxDegrees,
    })
  }

  function onPointerLeave() {
    const element = ref.current
    if (!element) return
    delete element.dataset.active
    writeTilt(element, { x: CENTER, y: CENTER, shine: RESTING_SHINE, maxDegrees })
  }

  return { ref, onPointerMove, onPointerLeave }
}
