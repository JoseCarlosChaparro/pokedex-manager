import { useRef, useState } from 'react'
import { DEFAULT_TYPE_COLOR, POKEMON_TYPE_COLORS } from '../pokemonTypes'
import { spriteUrl } from '../sprites'
import { prefersReducedMotion } from '../viewTransition'

// Share of the pack's width the strip must be dragged before it tears
const TEAR_THRESHOLD = 0.55
const REVEAL_MS = 900

// A newly favorited Pokémon arrives as a sealed booster pack. Drag the top strip sideways to tear it open,
// or use the "Abrir sobre" button (keyboard and non-drag alternative, WCAG 2.5.7).
export default function BoosterPack({ pokemon, onOpen }) {
  const packRef = useRef(null)
  const dragRef = useRef(null)
  const [isTorn, setIsTorn] = useState(false)
  // Synchronous guard: two quick clicks happen before React re-renders with isTorn = true
  const tornRef = useRef(false)
  const [primary, secondary = primary] = pokemon.types ?? []
  const name = pokemon.name.replaceAll('-', ' ')

  function setProgress(progress) {
    packRef.current?.style.setProperty('--tear', String(progress))
  }

  function tear() {
    if (tornRef.current) return
    tornRef.current = true
    setIsTorn(true)
    setProgress(1)
    window.setTimeout(() => onOpen(pokemon), prefersReducedMotion() ? 0 : REVEAL_MS)
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
    setProgress(Math.min(1, Math.abs(event.clientX - drag.startX) / drag.width))
  }

  function handlePointerUp(event) {
    const drag = dragRef.current
    dragRef.current = null
    delete packRef.current.dataset.dragging
    if (!drag) return
    const progress = Math.abs(event.clientX - drag.startX) / drag.width
    if (progress >= TEAR_THRESHOLD) tear()
    else setProgress(0)
  }

  return (
    <li data-flip-id={pokemon.id} data-pokemon-id={pokemon.id} className="relative">
      <div
        ref={packRef}
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
          <span>⇠ arrastra para abrir ⇢</span>
        </div>
        <div className="booster__body">
          <span className="booster__brand">POKÉ PACK</span>
          <img src={spriteUrl(pokemon.id)} alt="" className="booster__silhouette [image-rendering:pixelated]" />
          <span className="booster__hint">¿Quién será?</span>
        </div>
        <div className="booster__reveal" aria-hidden={!isTorn}>
          <img src={spriteUrl(pokemon.id)} alt="" className="h-24 w-24 [image-rendering:pixelated]" />
          <span className="font-bold capitalize">{name}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={tear}
        disabled={isTorn}
        className="mt-2 min-h-11 w-full rounded-xl bg-white/80 text-sm font-semibold ring-1 ring-slate-300/70 backdrop-blur hover:bg-white disabled:opacity-50 dark:bg-slate-800/80 dark:ring-slate-600"
      >
        Abrir sobre <span className="sr-only">de {name}</span>
      </button>
    </li>
  )
}
