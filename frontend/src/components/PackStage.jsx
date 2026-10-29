import { createPortal } from 'react-dom'
import { typeColor } from '../pokemonTypes'
import PokemonCardFace from './PokemonCardFace'

// Full-screen layer for the opening. It sits in <body> so it stacks above the gallery. It is empty (and hidden)
// except while a pack opens, when it holds the revealed card; playPackOpening adds its own elements to it.
export default function PackStage({ stageRef, cardRef, pokemon, density, isOpening }) {
  const [primary, secondary = primary] = pokemon.types ?? []
  return createPortal(
    <div ref={stageRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 empty:hidden">
      {isOpening && (
        <div
          ref={cardRef}
          className="pokemon-card holo-reveal-card"
          style={{ '--c1': typeColor(primary), '--c2': typeColor(secondary) }}
        >
          <PokemonCardFace pokemon={pokemon} density={density} />
        </div>
      )}
    </div>,
    document.body,
  )
}
