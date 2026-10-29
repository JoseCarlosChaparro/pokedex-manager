import { typeColor } from '../pokemonTypes'
import FavoriteButton from './FavoriteButton'
import { cardPadding } from '../cardPadding'
import PokemonCardFace from './PokemonCardFace'

const STAGGER_MS = 25
const MAX_STAGGERED = 24
// Phone grids show 1 to 3 columns, so the first three cards cover the first row on every phone layout
const FIRST_ROW_LENGTH = 3

// skipEnter: the card a pack has just revealed already showed itself on the stage, so it does not fade in again
export default function PokemonCard({ pokemon, index, density, isFavorite, onOpen, onToggleFavorite, skipEnter = false }) {
  const [primary, secondary = primary] = pokemon.types ?? []
  const isFirstRow = index < FIRST_ROW_LENGTH

  return (
    <li
      data-flip-id={pokemon.id}
      data-pokemon-id={pokemon.id}
      className={skipEnter ? 'relative' : 'card-enter relative'}
      style={{
        animationDelay: `${Math.min(index, MAX_STAGGERED) * STAGGER_MS}ms`,
        '--c1': typeColor(primary),
        '--c2': typeColor(secondary),
      }}
    >
      <button
        type="button"
        onClick={(event) => onOpen(pokemon, event.currentTarget.querySelector('img'))}
        className={`pokemon-card group w-full text-left ${cardPadding(density)}`}
      >
        <PokemonCardFace pokemon={pokemon} density={density} isFirstRow={isFirstRow} />
      </button>
      <FavoriteButton
        pokemon={pokemon}
        isFavorite={isFavorite}
        onToggle={(_, button) => onToggleFavorite(pokemon, button)}
        className="absolute top-1.5 right-1.5"
      />
    </li>
  )
}

export function PokemonCardSkeleton() {
  return (
    <li aria-hidden="true" className="rounded-3xl bg-white/60 p-3 ring-1 ring-slate-200 backdrop-blur dark:bg-slate-800/60 dark:ring-slate-700">
      <div className="mx-auto h-24 w-24 rounded-full bg-slate-200 motion-safe:animate-pulse dark:bg-slate-700" />
      <div className="mt-2 h-3 w-12 rounded bg-slate-200 motion-safe:animate-pulse dark:bg-slate-700" />
      <div className="mt-2 h-4 w-24 rounded bg-slate-200 motion-safe:animate-pulse dark:bg-slate-700" />
    </li>
  )
}
