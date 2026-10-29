import { MoveHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_TYPE_COLOR, POKEMON_TYPE_COLORS } from '../pokemonTypes'
import { spriteUrl } from '../sprites'
import { prefersReducedMotion } from '../motion'
import { useTilt } from '../hooks/useTilt'
import { playPackOpening } from '../packOpening'
import PackStage from './PackStage'

// Share of the pack's width the strip must be dragged before it tears
const TEAR_THRESHOLD = 0.55
const PACK_MAX_DEGREES = 6
// The strip tears off toward the side it is dragged to (or right, for the button)
const TEAR_TOWARD_RIGHT = 1
const TEAR_TOWARD_LEFT = -1
const PACK_SEALED = 'sealed'
const PACK_OPENING = 'opening'
const PACK_TORN = 'torn'

// Share of the pack's width the pointer has moved from where the drag started
const dragProgress = (clientX, drag) => Math.abs(clientX - drag.startX) / drag.width
const tearDirectionFor = (clientX, drag) => (clientX < drag.startX ? TEAR_TOWARD_LEFT : TEAR_TOWARD_RIGHT)

// A newly favorited Pokémon arrives as a sealed booster pack. Drag the top strip sideways to tear it open,
// or use the "Open pack" button (keyboard and non-drag alternative, WCAG 2.5.7).
// Strategy pattern: playOpening is the animation; tests inject a fake so GSAP never runs in jsdom.
export default function BoosterPack({ pokemon, position, onOpen, playOpening = playPackOpening }) {
  const { t } = useTranslation()
  const { ref: packRef, onPointerMove: onTiltMove, onPointerLeave: onTiltLeave } = useTilt({
    maxDegrees: PACK_MAX_DEGREES,
  })
  const slotRef = useRef(null)
  const stageRef = useRef(null)
  const revealRef = useRef(null)
  const dragRef = useRef(null)
  const [status, setStatus] = useState(PACK_SEALED)
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
  const name = pokemon.name.replaceAll('-', ' ')
  const isTorn = status === PACK_TORN

  // Once the opening starts, GSAP owns the pack's transforms: the tilt is frozen
  function handleTiltMove(event) {
    if (!openingRef.current) onTiltMove(event)
  }

  function handleTiltLeave() {
    if (!openingRef.current) onTiltLeave()
  }

  function setProgress(progress) {
    packRef.current?.style.setProperty('--tear', String(progress))
  }

  function setTearDirection(direction) {
    packRef.current?.style.setProperty('--tear-dir', String(direction))
  }

  function tear(direction) {
    if (openingRef.current) return
    openingRef.current = true
    setTearDirection(direction)
    setProgress(1)
    onTiltLeave()
    setStatus(PACK_OPENING)
    playOpening({
      pack: packRef.current,
      stage: stageRef.current,
      slot: slotRef.current,
      card: revealRef.current,
      reducedMotion: prefersReducedMotion(),
    }).then(() => {
      if (!mountedRef.current) return
      setStatus(PACK_TORN)
      onOpen(pokemon)
    })
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
    if (dragProgress(event.clientX, drag) >= TEAR_THRESHOLD) tear(tearDirectionFor(event.clientX, drag))
    else setProgress(0)
  }

  return (
    <li data-flip-id={pokemon.id} data-pokemon-id={pokemon.id} className="relative">
      <div ref={slotRef}>
        <div
          ref={packRef}
          onPointerMove={handleTiltMove}
          onPointerLeave={handleTiltLeave}
          className={`booster ${isTorn ? 'booster--torn' : ''}`}
          style={{
            '--c1': POKEMON_TYPE_COLORS[primary] ?? DEFAULT_TYPE_COLOR,
            '--c2': POKEMON_TYPE_COLORS[secondary] ?? DEFAULT_TYPE_COLOR,
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
            <span className="inline-flex items-center gap-2">
              <MoveHorizontal aria-hidden="true" className="size-4" />
              {t('pack.dragHint')}
            </span>
          </div>
          <div className="booster__body">
            <span className="booster__brand">{t('pack.brand')}</span>
            <img src={spriteUrl(pokemon.id)} alt="" className="booster__silhouette [image-rendering:pixelated]" />
            <span className="booster__hint">{t('pack.question')}</span>
          </div>
          <div ref={revealRef} className="booster__reveal" aria-hidden={!isTorn}>
            <img src={spriteUrl(pokemon.id)} alt="" className="h-24 w-24 [image-rendering:pixelated]" />
            <span className="font-bold capitalize">{name}</span>
          </div>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {isTorn ? name : ''}
      </span>
      <button
        type="button"
        onClick={() => tear(TEAR_TOWARD_RIGHT)}
        disabled={status !== PACK_SEALED}
        className="mt-2 min-h-11 w-full rounded-xl bg-white/80 text-sm font-semibold ring-1 ring-slate-300/70 backdrop-blur hover:bg-white disabled:opacity-50 dark:bg-slate-800/80 dark:ring-slate-600"
      >
        {t('pack.open')} <span className="sr-only">{position}</span>
      </button>
      <PackStage stageRef={stageRef} />
    </li>
  )
}
