import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PokemonCardFace from './PokemonCardFace'

const PIKACHU = { id: 25, name: 'pikachu', types: ['electric'] }

const spriteOf = (props) => render(<PokemonCardFace pokemon={PIKACHU} density="comfy" {...props} />).container.querySelector('img')

describe('PokemonCardFace sprite loading', () => {
  it('loads the sprite lazily by default', () => {
    expect(spriteOf()).toHaveAttribute('loading', 'lazy')
  })

  it('loads the sprite eagerly when it is above the fold', () => {
    expect(spriteOf({ isAboveFold: true })).toHaveAttribute('loading', 'eager')
  })
})
