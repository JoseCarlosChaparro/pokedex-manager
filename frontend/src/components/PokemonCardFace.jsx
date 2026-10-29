import { useTranslation } from 'react-i18next'
import { typeColor } from '../pokemonTypes'
import { artworkUrl, spriteUrl } from '../sprites'

// The visible face of a Pokémon card: number, artwork, id, name and types. It has no buttons or handlers,
// so the card revealed by a pack and the collection card show exactly the same face.
export default function PokemonCardFace({ pokemon, density }) {
  const { t } = useTranslation()
  const isLarge = density === 'large'
  const isCompact = density === 'compact'
  const name = pokemon.name.replaceAll('-', ' ')

  return (
    <>
      <span aria-hidden="true" className="pokemon-card__number">
        {String(pokemon.id).padStart(isCompact ? 1 : 3, '0')}
      </span>
      <span aria-hidden="true" className="pokemon-card__glow" />
      <span className={`sprite-stage mx-auto block ${isLarge ? 'h-44 w-44' : isCompact ? 'h-16 w-16' : 'h-24 w-24'}`}>
        <img
          src={isLarge ? artworkUrl(pokemon.id) : spriteUrl(pokemon.id)}
          alt=""
          loading="lazy"
          width={isLarge ? 200 : 96}
          height={isLarge ? 200 : 96}
          className={`pokemon-card__sprite block h-full w-full ${isLarge ? '' : '[image-rendering:pixelated]'}`}
        />
      </span>
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
              {t(`types.${type}`, { defaultValue: type })}
            </span>
          ))}
        </span>
      )}
    </>
  )
}
