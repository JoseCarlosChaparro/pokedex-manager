import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '../api'
import { DEFAULT_TYPE_COLOR, POKEMON_TYPE_COLORS, POKEMON_TYPE_LABELS, readableTextColor } from '../pokemonTypes'
import { artworkUrl, spriteUrl } from '../sprites'
import FavoriteButton from './FavoriteButton'
import HoloCard, { HoloArt } from './HoloCard'

const STAT_LABELS = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'At. esp.',
  'special-defense': 'Def. esp.',
  speed: 'Velocidad',
}
const MAX_BASE_STAT = 255
const FIRST_POKEMON_ID = 1
const NATIONAL_DEX_SIZE = 1025
const UNAUTHORIZED = 401

const formatName = (name) => name.replaceAll('-', ' ')

function isTyping() {
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
}

export default function PokemonDetail({ pokemonId, onClose, onNavigate, onUnauthorized, isFavorite, onToggleFavorite }) {
  // Response tagged with the id it belongs to; while ids differ the previous card stays visible
  const [result, setResult] = useState({ id: null, pokemon: null, error: '' })
  const [showShiny, setShowShiny] = useState(false)
  const audioRef = useRef(null)
  const id = Number(pokemonId)

  useEffect(() => {
    let isStale = false
    apiRequest(`/api/pokemon/${pokemonId}`)
      .then((pokemon) => {
        if (!isStale) setResult({ id: pokemonId, pokemon, error: '' })
      })
      .catch((err) => {
        if (err.status === UNAUTHORIZED) return onUnauthorized()
        if (!isStale) setResult({ id: pokemonId, pokemon: null, error: 'No pudimos cargar este Pokémon. Intenta de nuevo.' })
      })
    return () => {
      isStale = true
    }
  }, [pokemonId, onUnauthorized])

  const isLoading = result.id !== pokemonId
  const pokemon = isLoading ? null : result.pokemon
  const canGoBack = id > FIRST_POKEMON_ID
  const canGoForward = id < NATIONAL_DEX_SIZE

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
      if (isTyping()) return
      if (event.key === 'ArrowLeft' && canGoBack) onNavigate(id - 1)
      if (event.key === 'ArrowRight' && canGoForward) onNavigate(id + 1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [id, canGoBack, canGoForward, onClose, onNavigate])

  function playCry() {
    audioRef.current?.pause()
    audioRef.current = new Audio(pokemon.cry)
    audioRef.current.volume = 0.5
    audioRef.current.play().catch(() => {})
  }

  const typeColor = POKEMON_TYPE_COLORS[pokemon?.types[0]] ?? DEFAULT_TYPE_COLOR
  const art = showShiny && pokemon?.images.shiny ? pokemon.images.shiny : (pokemon?.images.artwork ?? artworkUrl(id))
  const title = pokemon ? formatName(pokemon.name) : 'Pokémon'

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="pokemon-detail-title"
        onClick={(event) => event.stopPropagation()}
        className="max-h-full w-full max-w-md overflow-x-hidden overflow-y-auto overscroll-contain p-4 [scrollbar-width:none]"
      >
        <HoloCard color={typeColor}>
          <div className="relative z-10 flex items-center justify-between gap-2">
            <button
              type="button"
              autoFocus
              onClick={onClose}
              aria-label="Cerrar"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/80 text-2xl leading-none shadow-sm dark:bg-slate-900/70"
            >
              ×
            </button>
            <p className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-200">
              #{String(id).padStart(4, '0')}
            </p>
            {pokemon && (
              <FavoriteButton pokemon={{ id, name: pokemon.name }} isFavorite={isFavorite} onToggle={onToggleFavorite} />
            )}
          </div>

          <HoloArt>
          <img
            data-detail-art
            src={art}
            alt={pokemon ? `${title}${showShiny ? ' (variocolor)' : ''}` : ''}
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = spriteUrl(id)
            }}
            className={`relative mx-auto aspect-square w-48 drop-shadow-xl transition-opacity sm:w-60 ${isLoading ? 'opacity-60' : ''}`}
          />
          </HoloArt>

          <div className="relative z-10">
            <h2 id="pokemon-detail-title" className="mt-3 text-center text-3xl font-black capitalize">
              {pokemon ? title : <span className="mx-auto block h-9 w-40 rounded bg-black/10 motion-safe:animate-pulse" />}
            </h2>

            {result.error && !isLoading && (
              <p role="alert" className="mt-3 rounded-lg bg-red-100 p-3 text-red-800">
                {result.error}
              </p>
            )}

            {pokemon && (
              <>
                <ul className="my-3 flex justify-center gap-2" aria-label="Tipos">
                  {pokemon.types.map((type) => {
                    const color = POKEMON_TYPE_COLORS[type] ?? DEFAULT_TYPE_COLOR
                    return (
                    <li
                      key={type}
                      style={{ backgroundColor: color, color: readableTextColor(color) }}
                      className="rounded-full px-3 py-1 text-sm font-semibold"
                    >
                      {POKEMON_TYPE_LABELS[type] ?? type}
                    </li>
                    )
                  })}
                </ul>

                <div className="mb-4 flex flex-wrap justify-center gap-2">
                  {pokemon.cry && (
                    <button type="button" onClick={playCry} className="min-h-11 rounded-full bg-white/80 px-4 text-sm font-medium shadow-sm dark:bg-slate-900/70">
                      🔊 Escuchar grito
                    </button>
                  )}
                  {pokemon.images.shiny && (
                    <button
                      type="button"
                      aria-pressed={showShiny}
                      onClick={() => setShowShiny((value) => !value)}
                      className="min-h-11 rounded-full bg-white/80 px-4 text-sm font-medium shadow-sm aria-pressed:bg-amber-200 dark:bg-slate-900/70 dark:aria-pressed:bg-amber-700"
                    >
                      ✨ Variocolor
                    </button>
                  )}
                </div>

                <dl className="space-y-1.5 rounded-2xl bg-white/70 p-4 text-sm dark:bg-slate-900/60">
                  {pokemon.stats.map(({ name, value }) => (
                    <div key={name} className="grid grid-cols-[6rem_2.5rem_1fr] items-center gap-2">
                      <dt className="font-medium">{STAT_LABELS[name] ?? name}</dt>
                      <dd className="text-right font-mono tabular-nums">{value}</dd>
                      <dd aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                        <div
                          className="stat-bar h-full rounded-full"
                          style={{ width: `${(value / MAX_BASE_STAT) * 100}%`, backgroundColor: typeColor }}
                        />
                      </dd>
                    </div>
                  ))}
                </dl>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
                  <div className="rounded-2xl bg-white/70 p-3 dark:bg-slate-900/60">
                    <dt className="text-slate-600 dark:text-slate-300">Altura</dt>
                    <dd className="text-lg font-bold">{pokemon.height_m} m</dd>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-3 dark:bg-slate-900/60">
                    <dt className="text-slate-600 dark:text-slate-300">Peso</dt>
                    <dd className="text-lg font-bold">{pokemon.weight_kg} kg</dd>
                  </div>
                </dl>

                <h3 className="mt-4 font-semibold">Habilidades</h3>
                <ul className="mt-1 flex flex-wrap gap-2 text-sm capitalize">
                  {pokemon.abilities.map(({ name, is_hidden }) => (
                    <li key={name} className="rounded-full bg-white/70 px-3 py-1 dark:bg-slate-900/60">
                      {formatName(name)}
                      {is_hidden && <span className="ml-1 text-xs text-slate-600 normal-case dark:text-slate-300">(oculta)</span>}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <nav aria-label="Pokémon anterior y siguiente" className="mt-5 flex justify-between gap-2">
              <button
                type="button"
                disabled={!canGoBack}
                onClick={() => onNavigate(id - 1)}
                className="min-h-11 rounded-full bg-white/80 px-4 text-sm font-medium shadow-sm disabled:opacity-40 dark:bg-slate-900/70"
              >
                ← #{String(id - 1).padStart(4, '0')}
              </button>
              <button
                type="button"
                disabled={!canGoForward}
                onClick={() => onNavigate(id + 1)}
                className="min-h-11 rounded-full bg-white/80 px-4 text-sm font-medium shadow-sm disabled:opacity-40 dark:bg-slate-900/70"
              >
                #{String(id + 1).padStart(4, '0')} →
              </button>
            </nav>
          </div>
        </HoloCard>
      </article>
    </div>
  )
}
