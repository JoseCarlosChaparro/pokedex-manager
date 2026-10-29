import { useEffect, useMemo, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { COLLECTION_TARGET_SELECTOR, throwPokeBall } from '../flyToCollection'
import { useFavorites } from '../hooks/useFavorites'
import { useFlipGrid } from '../hooks/useFlipGrid'
import { usePokedexIndex } from '../hooks/usePokedexIndex'
import { useUrlState } from '../hooks/useUrlState'
import { prefersReducedMotion } from '../motion'
import { filterPokedex, paginate } from '../pokedexFilter'
import { POKEMON_TYPE_COLORS } from '../pokemonTypes'
import { VIEWS } from '../urlState'
import { playViewTransition, viewDirection } from '../viewTransition'
import AuroraBackground from './AuroraBackground'
import BoosterPack from './BoosterPack'
import EmptyState from './EmptyState'
import FilterBar from './FilterBar'
import Paginator from './Paginator'
import PokemonCard, { PokemonCardSkeleton } from './PokemonCard'
import PokemonDetail from './PokemonDetail'
import ViewTabs from './ViewTabs'

const PAGE_SIZE = 24
const CLEARED_FILTERS = { q: '', types: [], gen: '' }

const GRID_COLUMNS = {
  compact: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 2xl:grid-cols-12',
  comfy: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8',
  large: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
}

const cardButton = (id) => document.querySelector(`[data-pokemon-id="${id}"] button`)

export default function PokemonBrowser({ onUnauthorized, playTransition = playViewTransition }) {
  const { t } = useTranslation()
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

  // The grid slides toward the picked tab. The swap is flushed so the transition animates the new items.
  function changeView(view) {
    return playTransition({
      grid: gridRef.current,
      direction: viewDirection(url.view, view),
      reducedMotion: prefersReducedMotion(),
      swap: () => flushSync(() => setUrl({ view, page: 1 })),
    })
  }

  // Only adding throws a Poké Ball; removing from the collection stays still
  function handleToggleFavorite(pokemon, heartButton) {
    if (!isFavorite(pokemon.id)) throwPokeBall(heartButton, document.querySelector(COLLECTION_TARGET_SELECTOR))
    toggleFavorite(pokemon)
  }

  // Opening pushes a history entry; closing goes back to it, so Back after closing leaves the page cleanly.
  // A detail reached by a shared link has no entry of ours to go back to, so closing replaces instead.
  const openedInAppRef = useRef(false)
  const openPokemon = (pokemon) => {
    openedInAppRef.current = true
    setUrl({ pokemon: String(pokemon.id) })
  }
  const closePokemon = () => {
    if (openedInAppRef.current) window.history.back()
    else setUrl({ pokemon: null }, { replace: true })
    openedInAppRef.current = false
  }
  const showPokemon = (id) => setUrl({ pokemon: String(id) }, { replace: true })

  // Whatever closed the detail (button, Escape, backdrop, browser Back), return focus to its card
  const lastOpenedRef = useRef(url.pokemon)
  useEffect(() => {
    if (url.pokemon) {
      lastOpenedRef.current = url.pokemon
      return
    }
    if (lastOpenedRef.current) cardButton(lastOpenedRef.current)?.focus()
    lastOpenedRef.current = null
  }, [url.pokemon])

  // Keep the URL honest when a page number is out of range (e.g. after filtering)
  useEffect(() => {
    if (!isLoading && url.page !== page) setUrl({ page }, { replace: true })
  }, [isLoading, url.page, page, setUrl])

  const auroraColors = url.types.map((type) => POKEMON_TYPE_COLORS[type])
  const sealedCount = favorites.filter((favorite) => !favorite.opened).length
  const isCollectionEmpty = isFavoritesView && favorites.length === 0
  const emptyVariant = isCollectionEmpty ? 'collection' : 'noResults'
  const emptyAction = isCollectionEmpty ? () => changeView(VIEWS.all) : () => changeFilters(CLEARED_FILTERS)
  const error = indexError || favoritesError

  return (
    <section className="mx-auto max-w-[1920px] px-4 py-6 sm:px-6 2xl:px-10">
      <AuroraBackground colors={auroraColors} />

      <ViewTabs
        view={url.view}
        totalCount={index.length}
        favoritesCount={favorites.length}
        sealedCount={sealedCount}
        onChange={changeView}
      />

      <FilterBar filters={url} resultCount={filtered.length} onChange={changeFilters} />

      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-100 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">
          {t(error)}
        </p>
      )}

      {!isLoading && filtered.length === 0 && (
        <EmptyState variant={emptyVariant} onAction={emptyAction} />
      )}

      <ul ref={gridRef} aria-busy={isLoading} className={`grid gap-3 sm:gap-4 ${GRID_COLUMNS[url.density]}`}>
        {isLoading
          ? Array.from({ length: PAGE_SIZE }, (_, i) => <PokemonCardSkeleton key={i} />)
          : items.map((pokemon, i) =>
              isFavoritesView && pokemon.opened === false ? (
                <BoosterPack key={`pack-${pokemon.id}`} pokemon={pokemon} position={(page - 1) * PAGE_SIZE + i + 1} onOpen={openPack} />
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
