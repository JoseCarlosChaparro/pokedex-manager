import { DEFAULT_TYPE_COLOR, POKEMON_TYPE_COLORS, POKEMON_TYPE_LABELS } from '../pokemonTypes'
import { artworkUrl, spriteUrl } from '../sprites'
import FavoriteButton from './FavoriteButton'

const STAGGER_MS = 25
const MAX_STAGGERED = 24

const typeColor = (type) => POKEMON_TYPE_COLORS[type] ?? DEFAULT_TYPE_COLOR

export default function PokemonCard({ pokemon, index, density, isFavorite, onOpen, onToggleFavorite }) {
  const [primary, secondary = primary] = pokemon.types ?? []
  const isLarge = density === 'large'
  const isCompact = density === 'compact'
  const name = pokemon.name.replaceAll('-', ' ')

  return (
    <li
      data-flip-id={pokemon.id}
      data-pokemon-id={pokemon.id}
      className="card-enter relative"
      style={{
        animationDelay: `${Math.min(index, MAX_STAGGERED) * STAGGER_MS}ms`,
        '--c1': typeColor(primary),
        '--c2': typeColor(secondary),
      }}
    >
      <button
        type="button"
        onClick={(event) => onOpen(pokemon, event.currentTarget.querySelector('img'))}
        className={`pokemon-card group w-full text-left ${isCompact ? 'p-2' : 'p-3'}`}
      >
        <span aria-hidden="true" className="pokemon-card__number">
          {String(pokemon.id).padStart(isCompact ? 1 : 3, '0')}
        </span>
        <span aria-hidden="true" className="pokemon-card__glow" />
        <img
          src={isLarge ? artworkUrl(pokemon.id) : spriteUrl(pokemon.id)}
          alt=""
          loading="lazy"
          width={isLarge ? 200 : 96}
          height={isLarge ? 200 : 96}
          className={`pokemon-card__sprite relative mx-auto ${isLarge ? 'h-44 w-44' : isCompact ? 'h-16 w-16 [image-rendering:pixelated]' : 'h-24 w-24 [image-rendering:pixelated]'}`}
        />
        <span className="relative block text-xs font-semibold text-slate-700 dark:text-slate-200">
          #{String(pokemon.id).padStart(4, '0')}
        </span>
        <span className={`relative block truncate font-bold capitalize ${isLarge ? 'text-xl' : isCompact ? 'text-sm' : ''}`}>
          {name}
        </span>
        {!isCompact && pokemon.types && (
          <span className="relative mt-1.5 flex flex-wrap gap-1">
            {pokemon.types.map((type) => (
              <span key={type} className="pokemon-card__type" style={{ '--type': typeColor(type) }}>
                {POKEMON_TYPE_LABELS[type] ?? type}
              </span>
            ))}
          </span>
        )}
      </button>
      <FavoriteButton
        pokemon={pokemon}
        isFavorite={isFavorite}
        onToggle={(_, button) => onToggleFavorite(pokemon, button.closest('li')?.querySelector('img'))}
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
