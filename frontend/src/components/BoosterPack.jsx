import { MoveHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_TYPE_COLOR, POKEMON_TYPE_COLORS } from '../pokemonTypes'
import { spriteUrl } from '../sprites'
import { prefersReducedMotion } from '../motion'
import { useTilt } from '../hooks/useTilt'

// Share of the pack's width the strip must be dragged before it tears
const TEAR_THRESHOLD = 0.55
const REVEAL_MS = 900
const PACK_MAX_DEGREES = 6
// The strip tears off toward the side it is dragged to (or right, for the button)
const TEAR_TOWARD_RIGHT = 1
const TEAR_TOWARD_LEFT = -1

// Share of the pack's width the pointer has moved from where the drag started
const dragProgress = (clientX, drag) => Math.abs(clientX - drag.startX) / drag.width
const tearDirectionFor = (clientX, drag) => (clientX < drag.startX ? TEAR_TOWARD_LEFT : TEAR_TOWARD_RIGHT)

// A newly favorited Pokémon arrives as a sealed booster pack. Drag the top strip sideways to tear it open,
// or use the "Open pack" button (keyboard and non-drag alternative, WCAG 2.5.7).
export default function BoosterPack({ pokemon, position, onOpen }) {
  const { t } = useTranslation()
  const { ref: packRef, onPointerMove: onTiltMove, onPointerLeave: onTiltLeave } = useTilt({
    maxDegrees: PACK_MAX_DEGREES,
  })
  const dragRef = useRef(null)
  const [isTorn, setIsTorn] = useState(false)
  // Synchronous guard: two quick clicks happen before React re-renders with isTorn = true
  const tornRef = useRef(false)
  const revealTimerRef = useRef(null)
  useEffect(() => () => window.clearTimeout(revealTimerRef.current), [])
  const [primary, secondary = primary] = pokemon.types ?? []
  const name = pokemon.name.replaceAll('-', ' ')

  function setProgress(progress) {
    packRef.current?.style.setProperty('--tear', String(progress))
  }

  function setTearDirection(direction) {
    packRef.current?.style.setProperty('--tear-dir', String(direction))
  }

  function tear(direction) {
    if (tornRef.current) return
    tornRef.current = true
    setTearDirection(direction)
    setIsTorn(true)
    setProgress(1)
    revealTimerRef.current = window.setTimeout(() => onOpen(pokemon), prefersReducedMotion() ? 0 : REVEAL_MS)
  }

  function handlePointerDown(event) {
    if (tornRef.current) return
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
      <div
        ref={packRef}
        onPointerMove={onTiltMove}
        onPointerLeave={onTiltLeave}
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
        <div className="booster__reveal" aria-hidden={!isTorn}>
          <img src={spriteUrl(pokemon.id)} alt="" className="h-24 w-24 [image-rendering:pixelated]" />
          <span className="font-bold capitalize">{name}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => tear(TEAR_TOWARD_RIGHT)}
        disabled={isTorn}
        className="mt-2 min-h-11 w-full rounded-xl bg-white/80 text-sm font-semibold ring-1 ring-slate-300/70 backdrop-blur hover:bg-white disabled:opacity-50 dark:bg-slate-800/80 dark:ring-slate-600"
      >
        {t('pack.open')} <span className="sr-only">{position}</span>
      </button>
    </li>
  )
}
