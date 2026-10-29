import { MoveHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { typeColor } from '../pokemonTypes'
import { spriteUrl } from '../sprites'
import { prefersReducedMotion } from '../motion'
import { useTilt } from '../hooks/useTilt'
import PackStage from './PackStage'

// Share of the pack's width the strip must be dragged before it tears
const TEAR_THRESHOLD = 0.55
const PACK_MAX_DEGREES = 6
// The strip tears off toward the side it is dragged to (or right, for the button)
const TEAR_TOWARD_RIGHT = 1
const TEAR_TOWARD_LEFT = -1
const PACK_SEALED = 'sealed'
const PACK_OPENING = 'opening'

// Share of the pack's width the pointer has moved from where the drag started
const dragProgress = (clientX, drag) => Math.abs(clientX - drag.startX) / drag.width
const tearDirectionFor = (clientX, drag) => (clientX < drag.startX ? TEAR_TOWARD_LEFT : TEAR_TOWARD_RIGHT)
// A click from the keyboard (Enter or Space) has detail 0; mouse and touch clicks have detail 1 or more
const KEYBOARD_CLICK_DETAIL = 0

// The pack animation (GSAP) loads on the first opening, so the browser chunk does not carry it
function playPackOpeningLazily(options) {
  return import('../packOpening').then(({ playPackOpening }) => playPackOpening(options))
}

// A newly favorited Pokémon arrives as a sealed booster pack. Drag the top strip sideways to tear it open,
// or use the "Open pack" button (keyboard and non-drag alternative, WCAG 2.5.7).
// Strategy pattern: playOpening is the animation; tests inject a fake so GSAP never runs in jsdom.
export default function BoosterPack({ pokemon, position, density, onOpen, playOpening = playPackOpeningLazily }) {
  const { t } = useTranslation()
  const { ref: packRef, onPointerMove: onTiltMove, onPointerLeave: onTiltLeave } = useTilt({
    maxDegrees: PACK_MAX_DEGREES,
  })
  const itemRef = useRef(null)
  const slotRef = useRef(null)
  const stageRef = useRef(null)
  const cardRef = useRef(null)
  const dragRef = useRef(null)
  const [status, setStatus] = useState(PACK_SEALED)
  const isOpening = status === PACK_OPENING
  // Synchronous guard: two quick clicks happen before React re-renders with the new status
  const openingRef = useRef(false)
  const mountedRef = useRef(false)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])
  const [primary, secondary = primary] = pokemon.types ?? []

  // While the opening runs, GSAP owns the pack's transforms: the tilt is frozen
  function handleTiltMove(event) {
    if (!isOpening) onTiltMove(event)
  }

  function handleTiltLeave() {
    if (!isOpening) onTiltLeave()
  }

  function setProgress(progress) {
    packRef.current?.style.setProperty('--tear', String(progress))
  }

  function setTearDirection(direction) {
    packRef.current?.style.setProperty('--tear-dir', String(direction))
  }

  // Runs on success and on failure alike: a failed animation must not strand the pack
  function completeOpening(restoreFocus) {
    openingRef.current = false
    if (!mountedRef.current) return
    setStatus(PACK_SEALED)
    onOpen(pokemon, { restoreFocus })
  }

  // Focus moves to the new card only for keyboard users, so a mouse user keeps their place
  function tear(direction, { viaKeyboard }) {
    if (openingRef.current) return
    openingRef.current = true
    const restoreFocus = viaKeyboard && itemRef.current.contains(document.activeElement)
    setTearDirection(direction)
    setProgress(1)
    onTiltLeave()
    // flushSync mounts the stage and the revealed card before the opening animates them
    flushSync(() => setStatus(PACK_OPENING))
    const complete = () => completeOpening(restoreFocus)
    playOpening({
      pack: packRef.current,
      stage: stageRef.current,
      slot: slotRef.current,
      card: cardRef.current,
      reducedMotion: prefersReducedMotion(),
    }).then(complete, complete)
  }

  function handlePointerDown(event) {
    if (openingRef.current) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { startX: event.clientX, width: packRef.current.getBoundingClientRect().width }
    packRef.current.dataset.dragging = ''
  }

  function handlePointerMove(event) {
    const drag = dragRef.current
    if (!drag) return
    setTearDirection(tearDirectionFor(event.clientX, drag))
    setProgress(Math.min(1, dragProgress(event.clientX, drag)))
  }

  function handlePointerUp(event) {
    const drag = dragRef.current
    dragRef.current = null
    delete packRef.current.dataset.dragging
    if (!drag) return
    if (dragProgress(event.clientX, drag) >= TEAR_THRESHOLD)
      tear(tearDirectionFor(event.clientX, drag), { viaKeyboard: false })
    else setProgress(0)
  }

  return (
    <li ref={itemRef} data-flip-id={pokemon.id} data-pokemon-id={pokemon.id} className="relative">
      <div ref={slotRef}>
        <div
          ref={packRef}
          onPointerMove={handleTiltMove}
          onPointerLeave={handleTiltLeave}
          className="booster"
          style={{
            '--c1': typeColor(primary),
            '--c2': typeColor(secondary),
            visibility: isOpening ? 'hidden' : undefined,
          }}
        >
          <div
            className="booster__strip"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            aria-hidden="true"
          >
            <span className="inline-flex max-w-full min-w-0 items-center gap-1.5">
              <MoveHorizontal aria-hidden="true" className="size-4 shrink-0" />
              <span className="min-w-0 truncate">{t('pack.dragHint')}</span>
            </span>
          </div>
          <div className="booster__body">
            <span className="booster__brand">{t('pack.brand')}</span>
            <img src={spriteUrl(pokemon.id)} alt="" className="booster__silhouette [image-rendering:pixelated]" />
            <span className="booster__hint">{t('pack.question')}</span>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={(event) => tear(TEAR_TOWARD_RIGHT, { viaKeyboard: event.detail === KEYBOARD_CLICK_DETAIL })}
        disabled={isOpening}
        className="mt-2 min-h-11 w-full rounded-xl bg-white/80 text-sm font-semibold ring-1 ring-slate-300/70 backdrop-blur hover:bg-white disabled:opacity-50 dark:bg-slate-800/80 dark:ring-slate-600"
      >
        {t('pack.open')} <span className="sr-only">{position}</span>
      </button>
      <PackStage stageRef={stageRef} cardRef={cardRef} pokemon={pokemon} density={density} isOpening={isOpening} />
    </li>
  )
}
