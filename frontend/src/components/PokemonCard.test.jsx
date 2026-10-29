import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PokemonCard from './PokemonCard'

const PIKACHU = { id: 25, name: 'pikachu', types: ['electric'] }

function renderCard(props = {}) {
  const { container } = render(
    <ul>
      <PokemonCard pokemon={PIKACHU} index={0} density="comfy" isFavorite onOpen={vi.fn()} onToggleFavorite={vi.fn()} {...props} />
    </ul>,
  )
  return container.querySelector('li')
}

describe('PokemonCard entrance', () => {
  it('plays the entrance animation by default', () => {
    expect(renderCard()).toHaveClass('card-enter')
  })

  it('skips the entrance animation for the card a pack has just revealed', () => {
    expect(renderCard({ skipEnter: true })).not.toHaveClass('card-enter')
  })
})
