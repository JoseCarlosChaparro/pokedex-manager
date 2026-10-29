import { spriteUrl } from '../sprites'
import FavoriteButton from './FavoriteButton'

const STAGGER_MS = 35

export default function PokemonCard({ pokemon, index, isFavorite, onOpen, onToggleFavorite }) {
  return (
    <li
      className="card-enter relative"
      style={{ animationDelay: `${index * STAGGER_MS}ms` }}
      data-pokemon-id={pokemon.id}
    >
      <button
        type="button"
        onClick={(event) => onOpen(pokemon, event.currentTarget.querySelector('img'))}
        className="group w-full rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:bg-slate-800 dark:ring-slate-700"
      >
        <img
          src={spriteUrl(pokemon.id)}
          alt=""
          loading="lazy"
          width="96"
          height="96"
          className="mx-auto h-24 w-24 transition-transform group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100 [image-rendering:pixelated]"
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">#{String(pokemon.id).padStart(4, '0')}</p>
        <p className="font-semibold capitalize">{pokemon.name.replaceAll('-', ' ')}</p>
      </button>
      <FavoriteButton
        pokemon={pokemon}
        isFavorite={isFavorite}
        onToggle={onToggleFavorite}
        className="absolute top-1.5 right-1.5"
      />
    </li>
  )
}

export function PokemonCardSkeleton() {
  return (
    <li aria-hidden="true" className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
      <div className="mx-auto h-24 w-24 rounded-full bg-slate-200 motion-safe:animate-pulse dark:bg-slate-700" />
      <div className="mx-auto mt-2 h-3 w-12 rounded bg-slate-200 motion-safe:animate-pulse dark:bg-slate-700" />
      <div className="mx-auto mt-2 h-4 w-20 rounded bg-slate-200 motion-safe:animate-pulse dark:bg-slate-700" />
    </li>
  )
}
