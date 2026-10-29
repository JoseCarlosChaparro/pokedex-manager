import { describe, expect, it } from 'vitest'
import { POKEMON_TYPE_COLORS, contrastRatio, readableTextColor } from './pokemonTypes'

describe('readableTextColor', () => {
  it.each(Object.entries(POKEMON_TYPE_COLORS))('%s badge text has at least 4.5:1 contrast', (_, color) => {
    expect(contrastRatio(readableTextColor(color), color)).toBeGreaterThanOrEqual(4.5)
  })
})
