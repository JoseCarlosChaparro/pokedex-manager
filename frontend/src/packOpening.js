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
const FLIP_IN_SECONDS = 0.6
const FLIP_IN_EASE = 'back.out(1.4)'
const FLIP_IN_FROM_DEGREES = -110
const FLIP_IN_FROM_SCALE = 0.7
const PERSPECTIVE_PX = 800
const FOIL_SWEEP_SECONDS = 0.9
const HOLD_SECONDS = 0.6
const VIBRATE_PATTERN = [40, 30, 80]

// The booster is 5:7 (width:height). The centered pack keeps 72% of the stage width, and
// 70% of its height on short landscape screens, capped so it never outgrows a 2K display.
const PACK_HEIGHT_RATIO = 7 / 5
const STAGE_PACK_WIDTH_SHARE = 0.72
const STAGE_PACK_HEIGHT_SHARE = 0.7
const STAGE_PACK_MAX_WIDTH_PX = 352

const BACKDROP_COLOR = 'rgb(2 6 23 / 0.85)'
const BACKDROP_CLEAR = 'rgb(2 6 23 / 0)'
const TORN_CLASS = 'booster--torn'
const FLASH_CLASS = 'pack-stage-flash'
const PARTICLE_CLASS = 'pack-stage-particle'
const SHEEN_CLASS = 'pack-stage-sheen'

// Strategy pattern: BoosterPack receives this as its playOpening prop, so its tests inject a fake.
// Reduced motion gets only the reveal fade; the full sequence flies a copy of the pack through the stage.
export function playPackOpening({ pack, stage, slot, card, reducedMotion }) {
  return reducedMotion ? fadeInReveal({ pack, card }) : playFullSequence({ pack, stage, slot })
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

function tween(target, from, to) {
  return new Promise((resolve) => {
    gsap.fromTo(target, from, { ...to, onComplete: resolve })
  })
}

async function fadeInReveal({ pack, card }) {
  pack.classList.add(TORN_CLASS)
  await tween(card, { opacity: 0 }, { opacity: 1, duration: REDUCED_FADE_SECONDS })
}

async function playFullSequence({ pack, stage, slot }) {
  const clone = startClone(pack, stage)
  try {
    await Promise.all([flyTo(clone, centeredRect(stage.getBoundingClientRect())), dimBackdrop(stage)])
    vibratePack()
    await Promise.all([shake(stage), flash(stage), burstParticles(stage, pack)])
    clone.classList.add(TORN_CLASS)
    await Promise.all([flipIn(clone), sweepFoil(clone)])
    await hold()
    await flyTo(clone, slot.getBoundingClientRect())
    pack.classList.add(TORN_CLASS)
  } finally {
    pack.style.visibility = ''
    stage.style.removeProperty('background-color')
    clone.remove()
  }
}

// The original pack stays in the list (hidden) so React keeps owning its node; the clone does the work
function startClone(pack, stage) {
  const clone = pack.cloneNode(true)
  // The .booster transition would lag behind every frame GSAP writes
  clone.style.transition = 'none'
  placeFixed(clone, pack.getBoundingClientRect())
  stage.append(clone)
  pack.style.visibility = 'hidden'
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

function flipIn(clone) {
  return tween(
    clone,
    { rotationY: FLIP_IN_FROM_DEGREES, scale: FLIP_IN_FROM_SCALE, transformPerspective: PERSPECTIVE_PX },
    { rotationY: 0, scale: 1, transformPerspective: PERSPECTIVE_PX, duration: FLIP_IN_SECONDS, ease: FLIP_IN_EASE },
  )
}

async function sweepFoil(clone) {
  const sheen = appendElement(clone, SHEEN_CLASS)
  await tween(sheen, { backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', duration: FOIL_SWEEP_SECONDS })
  sheen.remove()
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
