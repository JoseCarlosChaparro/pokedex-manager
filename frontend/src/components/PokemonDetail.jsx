import { Fragment, useEffect, useState } from 'react'
import { apiRequest } from '../api'
import { POKEMON_TYPE_LABELS } from '../pokemonTypes'

const STAT_LABELS = { hp: 'HP', attack: 'Ataque', defense: 'Defensa' }

export default function PokemonDetail({ pokemonId, onClose, onUnauthorized }) {
  const [pokemon, setPokemon] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isStale = false
    apiRequest(`/api/pokemon/${pokemonId}`)
      .then((data) => {
        if (!isStale) setPokemon(data)
      })
      .catch((err) => {
        if (err.status === 401) onUnauthorized()
        else if (!isStale) setError('No pudimos cargar este Pokémon. Intenta de nuevo.')
      })
    return () => {
      isStale = true
    }
  }, [pokemonId, onUnauthorized])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const baseStats = pokemon?.stats.filter(({ name }) => name in STAT_LABELS) ?? []

  return (
    <div className="fixed inset-0 z-10 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <article
        role="dialog" aria-modal="true" aria-label="Detalle del Pokémon"
        onClick={(event) => event.stopPropagation()}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
      >
        <button autoFocus onClick={onClose} aria-label="Cerrar" className="float-right h-8 w-8 text-2xl leading-none">
          ×
        </button>

        {error && <p role="alert" className="text-red-700">{error}</p>}
        {!pokemon && !error && <p className="py-10 text-center text-slate-500">Cargando…</p>}

        {pokemon && (
          <>
            <img src={pokemon.images.artwork ?? pokemon.images.sprite} alt={pokemon.name} className="mx-auto h-40 w-40" />
            <p className="text-center text-slate-500">#{pokemon.id}</p>
            <h2 className="text-center text-2xl font-bold capitalize">{pokemon.name}</h2>

            <ul className="my-3 flex justify-center gap-2">
              {pokemon.types.map((type) => (
                <li key={type} className="rounded-full bg-slate-200 px-3 py-1 text-sm">
                  {POKEMON_TYPE_LABELS[type] ?? type}
                </li>
              ))}
            </ul>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {baseStats.map(({ name, value }) => (
                <Fragment key={name}>
                  <dt className="font-medium">{STAT_LABELS[name]}</dt>
                  <dd>{value}</dd>
                </Fragment>
              ))}
              <dt className="font-medium">Altura</dt>
              <dd>{pokemon.height_m} m</dd>
              <dt className="font-medium">Peso</dt>
              <dd>{pokemon.weight_kg} kg</dd>
            </dl>

            <h3 className="mt-4 font-semibold">Habilidades</h3>
            <ul className="list-inside list-disc text-sm capitalize">
              {pokemon.abilities.map(({ name }) => (
                <li key={name}>{name.replace('-', ' ')}</li>
              ))}
            </ul>
          </>
        )}
      </article>
    </div>
  )
}
