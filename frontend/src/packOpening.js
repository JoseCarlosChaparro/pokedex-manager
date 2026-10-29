import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'

gsap.registerPlugin(Flip)

// Durations are in seconds (GSAP's unit)
const REDUCED_FADE_SECONDS = 0.2
const FLIGHT_SECONDS = 0.5
const FLIGHT_EASE = 'power3.inOut'
const SHAKE_LEG_SECONDS = 0.05
const SHAKE_REPEATS = 7
const SHAKE_PIXELS = 12
const FLASH_LEG_SECONDS = 0.15
const PARTICLE_COUNT = 24
const PARTICLE_RADIUS_PX = 160
const PARTICLE_SECONDS = 0.6
const BURST_SECONDS = 0.35
const BURST_SCALE = 1.2
const FLIP_IN_SECONDS = 0.6
const FLIP_IN_EASE = 'back.out(1.4)'
const FLIP_IN_FROM_DEGREES = 180
const PERSPECTIVE_PX = 800
const HOLD_SECONDS = 0.6
const VIBRATE_PATTERN = [40, 30, 80]
// A cold cache can leave the revealed sprite undecoded: the card waits this long at most, then flips in anyway
const SPRITE_DECODE_WAIT_MS = 400

// The booster is 5:7 (width:height). The centered pack keeps 72% of the stage width, and
// 70% of its height on short landscape screens, capped so it never outgrows a 2K display.
const PACK_HEIGHT_RATIO = 7 / 5
const STAGE_PACK_WIDTH_SHARE = 0.72
const STAGE_PACK_HEIGHT_SHARE = 0.7
const STAGE_PACK_MAX_WIDTH_PX = 352

const BACKDROP_COLOR = 'rgb(2 6 23 / 0.85)'
const BACKDROP_CLEAR = 'rgb(2 6 23 / 0)'
const FLASH_CLASS = 'pack-stage-flash'
const PARTICLE_CLASS = 'pack-stage-particle'
const FOIL_SWEEP_ATTRIBUTE = 'data-foil-sweep'

// Strategy pattern: BoosterPack receives this as its playOpening prop, so its tests inject a fake.
// Reduced motion gets only the card's fade in the slot. The full sequence flies a copy of the pack to the
// stage, then hands over to the revealed card, which flies back into the slot.
export function playPackOpening({ pack, stage, slot, card, reducedMotion }) {
  return reducedMotion ? fadeCardIntoSlot({ card, slot }) : playFullSequence({ pack, stage, slot, card })
}

// The largest 5:7 pack that fits the stage, centered in it
export function centeredRect(stageRect) {
  const width = Math.min(
    stageRect.width * STAGE_PACK_WIDTH_SHARE,
    (stageRect.height * STAGE_PACK_HEIGHT_SHARE) / PACK_HEIGHT_RATIO,
    STAGE_PACK_MAX_WIDTH_PX,
  )
  const height = width * PACK_HEIGHT_RATIO
  return {
    left: stageRect.left + (stageRect.width - width) / 2,
    top: stageRect.top + (stageRect.height - height) / 2,
    width,
    height,
  }
}

// Haptics exist only on some platforms; never call an unsupported API
export function vibratePack() {
  if (typeof navigator.vibrate === 'function') navigator.vibrate(VIBRATE_PATTERN)
}

// Resolves once the revealed sprite is decoded, so the card never flips in showing an empty frame.
// A failed decode or a slow download does not stall the opening past the wait.
export function waitForSpriteDecode(card) {
  const sprite = card.querySelector('img')
  if (!sprite?.decode) return Promise.resolve()
  const timeout = new Promise((resolve) => setTimeout(resolve, SPRITE_DECODE_WAIT_MS))
  return Promise.race([sprite.decode().catch(() => {}), timeout])
}

function tween(target, from, to) {
  return new Promise((resolve) => {
    gsap.fromTo(target, from, { ...to, onComplete: resolve })
  })
}

async function fadeCardIntoSlot({ card, slot }) {
  placeFixed(card, slot.getBoundingClientRect())
  await waitForSpriteDecode(card)
  await tween(card, { opacity: 0 }, { opacity: 1, duration: REDUCED_FADE_SECONDS })
}

async function playFullSequence({ pack, stage, slot, card }) {
  const clone = startClone(pack, stage)
  const centered = centeredRect(stage.getBoundingClientRect())
  // Decoding starts now, so it overlaps the flight and the card flips in once its sprite is ready
  const spriteReady = waitForSpriteDecode(card)
  try {
    await Promise.all([flyTo(clone, centered), dimBackdrop(stage)])
    vibratePack()
    await Promise.all([shake(stage), flash(stage), burstParticles(stage, pack)])
    placeFixed(card, centered)
    await Promise.all([burstAway(clone), spriteReady.then(() => flipCardIn(card))])
    await hold()
    await flyTo(card, slot.getBoundingClientRect())
  } finally {
    stage.style.removeProperty('background-color')
    clone.remove()
  }
}

// BoosterPack hides the original pack while the opening runs; the clone is the pack that travels
function startClone(pack, stage) {
  const clone = pack.cloneNode(true)
  // The original is hidden by React's style; the copy must not inherit that
  clone.style.visibility = ''
  placeFixed(clone, pack.getBoundingClientRect())
  stage.append(clone)
  return clone
}

function placeFixed(element, rect) {
  Object.assign(element.style, {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    // A CSS transition would lag behind every frame GSAP writes
    transition: 'none',
  })
}

// Flip: capture where the element is, move it to the target rect, then play the difference
function flyTo(element, rect) {
  const state = Flip.getState(element)
  placeFixed(element, rect)
  return new Promise((resolve) => {
    Flip.from(state, { duration: FLIGHT_SECONDS, ease: FLIGHT_EASE, scale: true, onComplete: resolve })
  })
}

function dimBackdrop(stage) {
  return tween(stage, { backgroundColor: BACKDROP_CLEAR }, { backgroundColor: BACKDROP_COLOR, duration: FLIGHT_SECONDS })
}

function shake(stage) {
  return tween(
    stage,
    { x: -SHAKE_PIXELS },
    { x: SHAKE_PIXELS, duration: SHAKE_LEG_SECONDS, repeat: SHAKE_REPEATS, yoyo: true, ease: 'none', clearProps: 'transform' },
  )
}

async function flash(stage) {
  const element = appendElement(stage, FLASH_CLASS)
  await tween(element, { opacity: 0 }, { opacity: 1, duration: FLASH_LEG_SECONDS, yoyo: true, repeat: 1 })
  element.remove()
}

// Particles fan out evenly around the stage center, alternating the pack's two type colours
function burstParticles(stage, pack) {
  const primary = pack.style.getPropertyValue('--c1')
  const secondary = pack.style.getPropertyValue('--c2')
  const angleStep = (2 * Math.PI) / PARTICLE_COUNT
  return Promise.all(
    Array.from({ length: PARTICLE_COUNT }, (_, index) => {
      const particle = appendElement(stage, PARTICLE_CLASS)
      particle.style.setProperty('--particle-color', index % 2 === 0 ? primary : secondary)
      const angle = index * angleStep
      const to = {
        x: Math.cos(angle) * PARTICLE_RADIUS_PX,
        y: Math.sin(angle) * PARTICLE_RADIUS_PX,
        opacity: 0,
        scale: 0,
        duration: PARTICLE_SECONDS,
        ease: 'power2.out',
      }
      return tween(particle, { x: 0, y: 0, opacity: 1, scale: 1 }, to).then(() => particle.remove())
    }),
  )
}

// The pack bursts outward and fades while the card flips in
function burstAway(clone) {
  return tween(clone, { scale: 1, opacity: 1 }, { scale: BURST_SCALE, opacity: 0, duration: BURST_SECONDS, ease: 'power2.in' })
}

function flipCardIn(card) {
  card.setAttribute(FOIL_SWEEP_ATTRIBUTE, '')
  return tween(
    card,
    { rotationY: FLIP_IN_FROM_DEGREES, opacity: 0, transformPerspective: PERSPECTIVE_PX },
    { rotationY: 0, opacity: 1, transformPerspective: PERSPECTIVE_PX, duration: FLIP_IN_SECONDS, ease: FLIP_IN_EASE },
  )
}

function hold() {
  return new Promise((resolve) => gsap.delayedCall(HOLD_SECONDS, resolve))
}

function appendElement(parent, className) {
  const element = document.createElement('div')
  element.className = className
  parent.append(element)
  return element
}
