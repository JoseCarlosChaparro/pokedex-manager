import { prefersReducedMotion } from './motion'

export const COLLECTION_TARGET_SELECTOR = '[data-collection-target]'
const SEALED_BADGE_SELECTOR = '[data-sealed-badge]'
const BALL_CLASS = 'pokeball-throw'
const BALL_SIZE_PX = 28
const BALL_Z_INDEX = 50
const ARC_HEIGHT_PX = 120
const FLIGHT_MS = 380
const FLIGHT_EASING = 'cubic-bezier(0.5, 0, 0.3, 1)'
const START_SCALE = 0.4
// Three swings, each smaller than the last: 15°, then 9°, then 4°
const WOBBLE_MS = 210
const WOBBLE_ANGLES_DEG = [0, 15, -15, 9, -9, 4, -4, 0]
const FLASH_MS = 110
const FLASH_RING_PX = 14
const BADGE_BOUNCE_MS = 300
const BADGE_BOUNCE_SCALE = 1.35

const centerOf = (element) => {
  const rect = element.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

const isInViewport = (rect) => rect.right > 0 && rect.bottom > 0 && rect.left < window.innerWidth && rect.top < window.innerHeight

function canThrow(source, target) {
  return Boolean(source && target && typeof source.animate === 'function' && !prefersReducedMotion() && isInViewport(target.getBoundingClientRect()))
}

function createBall(center) {
  const ball = document.createElement('span')
  ball.className = `pokeball ${BALL_CLASS}`
  ball.setAttribute('aria-hidden', 'true')
  Object.assign(ball.style, {
    position: 'fixed',
    left: `${center.x - BALL_SIZE_PX / 2}px`,
    top: `${center.y - BALL_SIZE_PX / 2}px`,
    width: `${BALL_SIZE_PX}px`,
    height: `${BALL_SIZE_PX}px`,
    zIndex: BALL_Z_INDEX,
    pointerEvents: 'none',
  })
  return ball
}

// Starts small at the heart and arcs up and over to the tab
function flightKeyframes(dx, dy) {
  return [
    { transform: `translate(0, 0) scale(${START_SCALE})` },
    { transform: `translate(${dx / 2}px, ${dy / 2 - ARC_HEIGHT_PX}px) scale(1)`, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(1)` },
  ]
}

const wobbleKeyframes = WOBBLE_ANGLES_DEG.map((angle) => ({ rotate: `${angle}deg` }))

const flashKeyframes = [
  { boxShadow: '0 0 0 0 rgb(255 255 255 / 0.9)' },
  { boxShadow: `0 0 0 ${FLASH_RING_PX}px rgb(255 255 255 / 0)` },
]

function bounceSealedBadge() {
  document.querySelector(SEALED_BADGE_SELECTOR)?.animate(
    [{ transform: 'scale(1)' }, { transform: `scale(${BADGE_BOUNCE_SCALE})` }, { transform: 'scale(1)' }],
    { duration: BADGE_BOUNCE_MS, easing: 'ease-out' },
  )
}

async function flyBall(ball, from, to) {
  // fill: forwards keeps the ball at the tab while it wobbles
  await ball.animate(flightKeyframes(to.x - from.x, to.y - from.y), { duration: FLIGHT_MS, easing: FLIGHT_EASING, fill: 'forwards' }).finished
  bounceSealedBadge()
  await ball.animate(wobbleKeyframes, { duration: WOBBLE_MS, easing: 'ease-in-out' }).finished
  await ball.animate(flashKeyframes, { duration: FLASH_MS }).finished
}

// Played only when a Pokémon joins the collection: a Poké Ball leaves the heart and lands on the
// "Mi colección" tab. Skipped under reduced motion, without a target, or when the target is off-screen.
export async function throwPokeBall(source, target) {
  if (!canThrow(source, target)) return
  const from = centerOf(source)
  const ball = createBall(from)
  document.body.append(ball)
  try {
    await flyBall(ball, from, centerOf(target))
  } catch {
    // A cancelled animation only stops the throw; the ball is removed below either way
  } finally {
    ball.remove()
  }
}
