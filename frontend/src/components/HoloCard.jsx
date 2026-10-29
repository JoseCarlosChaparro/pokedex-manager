import { useEffect } from 'react'
import { prefersReducedMotion } from '../motion'
import { ACTIVE_SHINE, useTilt, writeTilt } from '../hooks/useTilt'

const MAX_TILT_DEGREES = 8
// Phone held upright: beta ≈ 45° is "centered"; ±GYRO_RANGE degrees maps to the card edges
const GYRO_CENTER_BETA = 45
const GYRO_RANGE_DEGREES = 30

const clamp01 = (value) => Math.min(1, Math.max(0, value))

// Trading-card tilt + holographic foil. Pointer tilt comes from useTilt; the gyroscope drives the same
// variables on touch devices. Static under prefers-reduced-motion. The content is the same for keyboard
// and screen-reader users.
export default function HoloCard({ color, children }) {
  const { ref: cardRef, onPointerMove, onPointerLeave } = useTilt({ maxDegrees: MAX_TILT_DEGREES })

  useEffect(() => {
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    if (prefersReducedMotion() || !isTouchDevice) return undefined
    function handleOrientation(event) {
      if (event.gamma === null || event.beta === null) return
      const x = clamp01(0.5 + event.gamma / (2 * GYRO_RANGE_DEGREES))
      const y = clamp01(0.5 + (event.beta - GYRO_CENTER_BETA) / (2 * GYRO_RANGE_DEGREES))
      delete cardRef.current?.dataset.intro
      writeTilt(cardRef.current, { x, y, shine: ACTIVE_SHINE, maxDegrees: MAX_TILT_DEGREES })
    }
    window.addEventListener('deviceorientation', handleOrientation)
    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [cardRef])

  function handlePointerMove(event) {
    if (event.pointerType !== 'touch') delete cardRef.current?.dataset.intro
    onPointerMove(event)
  }

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={onPointerLeave}
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
