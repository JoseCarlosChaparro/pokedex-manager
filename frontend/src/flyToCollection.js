import { prefersReducedMotion } from './motion'

const FLIGHT_MS = 750
const ARC_HEIGHT_PX = 120
const TARGET_SELECTOR = '[data-collection-target]'

// "Add to cart" style feedback: a copy of the sprite flies in an arc into the "Mi colección" button
export function flyToCollection(image) {
  const target = document.querySelector(TARGET_SELECTOR)
  if (!image || !target || prefersReducedMotion() || !image.animate) return
  const from = image.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  const flyer = image.cloneNode()
  Object.assign(flyer.style, {
    position: 'fixed',
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    zIndex: 50,
    pointerEvents: 'none',
  })
  document.body.append(flyer)

  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)
  const flight = flyer.animate(
    [
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx / 2}px, ${dy / 2 - ARC_HEIGHT_PX}px) scale(0.8) rotate(-12deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.2) rotate(8deg)`, opacity: 0.4 },
    ],
    { duration: FLIGHT_MS, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' },
  )
  const land = () => {
    flyer.remove()
    target.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
      { duration: 350, easing: 'ease-out' },
    )
  }
  // A cancelled animation rejects `finished`; clean up either way
  flight.finished.then(land, land)
}
