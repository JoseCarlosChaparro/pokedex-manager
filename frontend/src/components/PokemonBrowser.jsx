import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../api'
import { useFavorites } from '../hooks/useFavorites'
import { useUrlState } from '../hooks/useUrlState'
import { POKEMON_TYPE_LABELS } from '../pokemonTypes'
import { VIEWS } from '../urlState'
import { morphImage } from '../viewTransition'
import PokemonCard, { PokemonCardSkeleton } from './PokemonCard'
import PokemonDetail from './PokemonDetail'
import SearchBox from './SearchBox'

const PAGE_SIZE = 20
const SUGGESTION_LIMIT = 8
const UNAUTHORIZED = 401
const NOT_FOUND = 404

// PokéAPI list items only carry name + url; the id is the url's last path segment
function getIdFromUrl(url) {
  return Number(url.split('/').filter(Boolean).pop())
}

const cardImage = (id) => document.querySelector(`[data-pokemon-id="${id}"] img`)
const detailImage = () => document.querySelector('[data-detail-art]')

function listRequestPath({ q, type, page }) {
  if (q) return `/api/pokemon/search?name=${encodeURIComponent(q)}`
  const listPath = type ? `/api/pokemon/type/${type}` : '/api/pokemon'
  return `${listPath}?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`
}

function toPage(data, isSearch) {
  if (isSearch) return { count: 1, results: [{ id: data.id, name: data.name }] }
  return { count: data.count, results: data.results.map((p) => ({ id: getIdFromUrl(p.url), name: p.name })) }
}

function errorMessage(err, q) {
  if (q && err.status === NOT_FOUND) return `No encontramos "${q}".`
  return q ? 'La búsqueda falló. Intenta de nuevo.' : 'No pudimos cargar los Pokémon. Intenta de nuevo.'
}

export default function PokemonBrowser({ onUnauthorized }) {
  const [url, setUrl] = useUrlState()
  const { favorites, isFavorite, toggleFavorite, error: favoritesError } = useFavorites({ onUnauthorized })
  // Response tagged with the request it answers; "loading" = the current request has no response yet
  const [response, setResponse] = useState({ path: null, page: null, error: '' })

  const isFavoritesView = url.view === VIEWS.favorites
  const requestPath = isFavoritesView ? null : listRequestPath(url)

  useEffect(() => {
    if (!requestPath) return undefined
    let isStale = false
    apiRequest(requestPath)
      .then((data) => {
        if (!isStale) setResponse({ path: requestPath, page: toPage(data, Boolean(url.q)), error: '' })
      })
      .catch((err) => {
        if (err.status === UNAUTHORIZED) return onUnauthorized()
        if (!isStale) setResponse({ path: requestPath, page: null, error: errorMessage(err, url.q) })
      })
    return () => {
      isStale = true
    }
  }, [requestPath, url.q, onUnauthorized])

  const fetchSuggestions = useCallback(
    (query) =>
      apiRequest(`/api/pokemon/suggest?q=${encodeURIComponent(query)}&limit=${SUGGESTION_LIMIT}`).catch((err) => {
        if (err.status === UNAUTHORIZED) onUnauthorized()
        throw err
      }),
    [onUnauthorized],
  )

  const favoritesPage = {
    count: favorites.length,
    results: favorites.slice((url.page - 1) * PAGE_SIZE, url.page * PAGE_SIZE),
  }
  const isLoading = !isFavoritesView && response.path !== requestPath
  const page = isFavoritesView ? favoritesPage : response.page
  const listError = isFavoritesView || isLoading ? '' : response.error
  const totalPages = Math.max(1, Math.ceil((page?.count ?? 0) / PAGE_SIZE))

  const openPokemon = (pokemon, fromImage) =>
    morphImage(() => setUrl({ pokemon: String(pokemon.id) }), { from: fromImage, to: detailImage })
  const closePokemon = () => {
    const id = url.pokemon
    morphImage(() => setUrl({ pokemon: null }), { from: detailImage(), to: () => cardImage(id) }).then(() =>
      // Return keyboard focus to the card that opened the detail
      document.querySelector(`[data-pokemon-id="${id}"] button`)?.focus(),
    )
  }
  const showPokemon = (id) => setUrl({ pokemon: String(id) }, { replace: true })

  return (
    <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <SearchBox
          key={url.q}
          initialValue={url.q}
          fetchSuggestions={fetchSuggestions}
          onSubmit={(q) => setUrl({ q, page: 1, view: VIEWS.all, pokemon: null })}
          onSelect={(pokemon) => openPokemon(pokemon, null)}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <div role="group" aria-label="Vista" className="flex rounded-lg bg-slate-200 p-1 dark:bg-slate-800">
            {[
              [VIEWS.all, 'Todos'],
              [VIEWS.favorites, `Mi colección (${favorites.length})`],
            ].map(([view, label]) => (
              <button
                key={view}
                type="button"
                aria-pressed={url.view === view}
                onClick={() => setUrl({ view, page: 1, q: '' })}
                className="min-h-9 rounded-md px-3 text-sm whitespace-nowrap aria-pressed:bg-white aria-pressed:font-semibold aria-pressed:shadow-sm dark:aria-pressed:bg-slate-600"
              >
                {label}
              </button>
            ))}
          </div>
          {!isFavoritesView && (
            <select
              value={url.type}
              onChange={(event) => setUrl({ type: event.target.value, page: 1, q: '' })}
              aria-label="Filtrar por tipo"
              className="min-h-11 min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(POKEMON_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {(listError || favoritesError) && (
        <p role="alert" className="mb-4 rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">
          {listError || favoritesError}
        </p>
      )}

      {url.q && (
        <button type="button" onClick={() => setUrl({ q: '' })} className="mb-4 min-h-6 text-sm text-slate-600 underline dark:text-slate-300">
          Limpiar búsqueda
        </button>
      )}

      {isFavoritesView && favorites.length === 0 && (
        <p className="py-10 text-center text-slate-500 dark:text-slate-400">
          Tu colección está vacía. Toca el corazón de un Pokémon para guardarlo aquí.
        </p>
      )}

      <ul aria-busy={isLoading} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: PAGE_SIZE }, (_, index) => <PokemonCardSkeleton key={index} />)
          : page?.results.map((pokemon, index) => (
              <PokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                index={index}
                isFavorite={isFavorite(pokemon.id)}
                onOpen={openPokemon}
                onToggleFavorite={toggleFavorite}
              />
            ))}
      </ul>

      {!url.q && totalPages > 1 && (
        <nav aria-label="Paginación" className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={url.page <= 1}
            onClick={() => setUrl({ page: url.page - 1 })}
            className="min-h-11 rounded-lg bg-white px-4 shadow-sm ring-1 ring-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:ring-slate-700"
          >
            Anterior
          </button>
          <span className="text-sm">
            Página {url.page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={url.page >= totalPages}
            onClick={() => setUrl({ page: url.page + 1 })}
            className="min-h-11 rounded-lg bg-white px-4 shadow-sm ring-1 ring-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:ring-slate-700"
          >
            Siguiente
          </button>
        </nav>
      )}

      {url.pokemon && (
        <PokemonDetail
          pokemonId={url.pokemon}
          onClose={closePokemon}
          onNavigate={showPokemon}
          onUnauthorized={onUnauthorized}
          isFavorite={isFavorite(url.pokemon)}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </section>
  )
}
