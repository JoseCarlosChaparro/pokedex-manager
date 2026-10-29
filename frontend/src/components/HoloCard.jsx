import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../viewTransition'

const MAX_TILT_DEGREES = 8
const RESTING_SHINE = 0.35
const ACTIVE_SHINE = 1
// How far the foil gradients slide as the card tilts (percent of the background)
const FOIL_TRAVEL_PERCENT = 40
// Phone held upright: beta ≈ 45° is "centered"; ±GYRO_RANGE degrees maps to the card edges
const GYRO_CENTER_BETA = 45
const GYRO_RANGE_DEGREES = 30

const clamp01 = (value) => Math.min(1, Math.max(0, value))

// Trading-card tilt + holographic foil. Writes CSS variables directly (no React re-render per frame);
// static under prefers-reduced-motion. The content is the same for keyboard and screen-reader users.
export default function HoloCard({ color, children }) {
  const cardRef = useRef(null)

  // x, y in 0..1: where the light hits the card
  function applyLight(x, y, shine) {
    const card = cardRef.current
    if (!card) return
    const variables = {
      '--rx': `${(0.5 - y) * 2 * MAX_TILT_DEGREES}deg`,
      '--ry': `${(x - 0.5) * 2 * MAX_TILT_DEGREES}deg`,
      '--mx': `${x * 100}%`,
      '--my': `${y * 100}%`,
      '--bgx': `${50 + (x - 0.5) * FOIL_TRAVEL_PERCENT}%`,
      '--bgy': `${50 + (y - 0.5) * FOIL_TRAVEL_PERCENT}%`,
      '--shine': shine,
    }
    for (const [name, value] of Object.entries(variables)) card.style.setProperty(name, value)
  }

  useEffect(() => {
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    if (prefersReducedMotion() || !isTouchDevice) return undefined
    function handleOrientation(event) {
      if (event.gamma === null || event.beta === null) return
      const x = clamp01(0.5 + event.gamma / (2 * GYRO_RANGE_DEGREES))
      const y = clamp01(0.5 + (event.beta - GYRO_CENTER_BETA) / (2 * GYRO_RANGE_DEGREES))
      delete cardRef.current?.dataset.intro
      applyLight(x, y, ACTIVE_SHINE)
    }
    window.addEventListener('deviceorientation', handleOrientation)
    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [])

  function handlePointerMove(event) {
    if (prefersReducedMotion() || event.pointerType === 'touch') return
    delete cardRef.current.dataset.intro
    // Flatten over controls so buttons stay still and easy to hit
    if (event.target.closest('button')) {
      cardRef.current.dataset.active = ''
      applyLight(0.5, 0.5, ACTIVE_SHINE)
      return
    }
    const rect = cardRef.current.getBoundingClientRect()
    cardRef.current.dataset.active = ''
    applyLight((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height, ACTIVE_SHINE)
  }

  function handlePointerLeave() {
    delete cardRef.current.dataset.active
    applyLight(0.5, 0.5, RESTING_SHINE)
  }

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      // The opening light sweep plays once; the pointer or the end of the animation removes it
      data-intro=""
      onAnimationEnd={(event) => {
        if (event.target === cardRef.current) delete cardRef.current.dataset.intro
      }}
      style={{ '--type-color': color }}
      className="holo-card rounded-3xl p-5 shadow-2xl ring-1 ring-black/10 dark:ring-white/10"
    >
      {children}
    </div>
  )
}

// The framed artwork window: carries the strongest foil, like the holo box on a real card
export function HoloArt({ children }) {
  return <div className="holo-art mx-auto mt-3 w-full max-w-72 rounded-2xl">{children}</div>
}
