import { useMemo, useRef } from 'react'
import { flyToCollection } from '../flyToCollection'
import { useFavorites } from '../hooks/useFavorites'
import { useFlipGrid } from '../hooks/useFlipGrid'
import { usePokedexIndex } from '../hooks/usePokedexIndex'
import { useUrlState } from '../hooks/useUrlState'
import { filterPokedex, paginate } from '../pokedexFilter'
import { POKEMON_TYPE_COLORS } from '../pokemonTypes'
import { VIEWS } from '../urlState'
import { morphImage } from '../viewTransition'
import AuroraBackground from './AuroraBackground'
import BoosterPack from './BoosterPack'
import FilterBar from './FilterBar'
import Paginator from './Paginator'
import PokemonCard, { PokemonCardSkeleton } from './PokemonCard'
import PokemonDetail from './PokemonDetail'

const PAGE_SIZE = 24

const GRID_COLUMNS = {
  compact: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
  comfy: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6',
  large: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}

const cardImage = (id) => document.querySelector(`[data-pokemon-id="${id}"] img`)

export default function PokemonBrowser({ onUnauthorized }) {
  const [url, setUrl] = useUrlState()
  const { index, isLoading, error: indexError } = usePokedexIndex({ onUnauthorized })
  const { favorites, isFavorite, toggleFavorite, openPack, error: favoritesError } = useFavorites({ onUnauthorized })
  const gridRef = useRef(null)

  const isFavoritesView = url.view === VIEWS.favorites
  const source = useMemo(() => {
    if (!isFavoritesView) return index
    const byId = new Map(index.map((pokemon) => [pokemon.id, pokemon]))
    return favorites.map((favorite) => ({ ...byId.get(favorite.id), ...favorite }))
  }, [isFavoritesView, index, favorites])

  const filtered = useMemo(() => filterPokedex(source, url), [source, url])
  const { page, totalPages, items } = paginate(filtered, url.page, PAGE_SIZE)
  const layoutKey = `${url.view}|${url.density}|${page}|${items.map((p) => `${p.id}${p.opened ?? ''}`).join(',')}`
  const captureLayout = useFlipGrid(gridRef, layoutKey)

  // Filters and density animate with FLIP; typing replaces the history entry instead of adding one per key
  function changeFilters(changes, options) {
    captureLayout()
    setUrl({ ...changes, page: changes.page ?? 1 }, options)
  }

  function handleToggleFavorite(pokemon, image) {
    if (!isFavorite(pokemon.id)) flyToCollection(image)
    toggleFavorite(pokemon)
  }

  const openPokemon = (pokemon) => setUrl({ pokemon: String(pokemon.id) })
  const closePokemon = () => {
    const id = url.pokemon
    const detailImage = document.querySelector('[data-detail-art]')
    morphImage(() => setUrl({ pokemon: null }), { from: detailImage, to: () => cardImage(id) }).then(() =>
      // Return keyboard focus to the card that opened the detail
      document.querySelector(`[data-pokemon-id="${id}"] button`)?.focus(),
    )
  }
  const showPokemon = (id) => setUrl({ pokemon: String(id) }, { replace: true })

  const auroraColors = url.types.map((type) => POKEMON_TYPE_COLORS[type])
  const sealedCount = favorites.filter((favorite) => !favorite.opened).length
  const error = indexError || favoritesError

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
      <AuroraBackground colors={auroraColors} />

      <div role="group" aria-label="Vista" className="mb-4 inline-flex rounded-2xl bg-white/60 p-1 ring-1 ring-slate-300/70 backdrop-blur dark:bg-slate-800/60 dark:ring-slate-600">
        {[
          [VIEWS.all, 'Pokédex'],
          [VIEWS.favorites, `Mi colección (${favorites.length})`],
        ].map(([view, label]) => (
          <button
            key={view}
            type="button"
            aria-pressed={url.view === view}
            data-collection-target={view === VIEWS.favorites ? '' : undefined}
            onClick={() => changeFilters({ view })}
            className="relative min-h-11 rounded-xl px-4 text-sm font-semibold whitespace-nowrap aria-pressed:bg-red-600 aria-pressed:text-white aria-pressed:shadow"
          >
            {label}
            {view === VIEWS.favorites && sealedCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-amber-400 px-1 text-xs font-bold text-slate-900">
                {sealedCount}
                <span className="sr-only"> sobres sin abrir</span>
              </span>
            )}
          </button>
        ))}
      </div>

      <FilterBar filters={url} resultCount={filtered.length} onChange={changeFilters} />

      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-100 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="py-16 text-center text-lg text-slate-700 dark:text-slate-300">
          {isFavoritesView && favorites.length === 0
            ? 'Tu colección está vacía. Toca el corazón de un Pokémon y te llegará como sobre sellado. 🎴'
            : 'Ningún Pokémon coincide con esos filtros.'}
        </p>
      )}

      <ul ref={gridRef} aria-busy={isLoading} className={`grid gap-3 sm:gap-4 ${GRID_COLUMNS[url.density]}`}>
        {isLoading
          ? Array.from({ length: PAGE_SIZE }, (_, i) => <PokemonCardSkeleton key={i} />)
          : items.map((pokemon, i) =>
              isFavoritesView && pokemon.opened === false ? (
                <BoosterPack key={`pack-${pokemon.id}`} pokemon={pokemon} onOpen={openPack} />
              ) : (
                <PokemonCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  index={i}
                  density={url.density}
                  isFavorite={isFavorite(pokemon.id)}
                  onOpen={openPokemon}
                  onToggleFavorite={handleToggleFavorite}
                />
              ),
            )}
      </ul>

      <Paginator page={page} totalPages={totalPages} onChange={(newPage) => changeFilters({ page: newPage })} />

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
