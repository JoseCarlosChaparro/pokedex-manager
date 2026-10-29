import { createPortal } from 'react-dom'
import { typeColor } from '../pokemonTypes'
import { cardPadding } from '../cardPadding'
import PokemonCardFace from './PokemonCardFace'

// Full-screen layer for the opening. It sits in <body> so it stacks above the gallery. It is empty (and hidden)
// except while a pack opens, when it holds the revealed card; playPackOpening adds its own elements to it.
export default function PackStage({ stageRef, cardRef, pokemon, density, isOpening }) {
  const [primary, secondary = primary] = pokemon.types ?? []
  // While the opening runs the stage is the backdrop: it must stop clicks from reaching the gallery behind it
  const pointerClass = isOpening ? 'pointer-events-auto' : 'pointer-events-none'
  return createPortal(
    <div ref={stageRef} aria-hidden="true" className={`fixed inset-0 z-50 empty:hidden ${pointerClass}`}>
      {isOpening && (
        <div
          ref={cardRef}
          className={`pokemon-card holo-reveal-card ${cardPadding(density)}`}
          style={{ '--c1': typeColor(primary), '--c2': typeColor(secondary) }}
        >
          <PokemonCardFace pokemon={pokemon} density={density} isAboveFold />
        </div>
      )}
    </div>,
    document.body,
  )
}
