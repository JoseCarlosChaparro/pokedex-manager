import { describe, expect, it } from 'vitest'
import { preloadPokemonDetail } from './lazyComponents'

describe('preloadPokemonDetail', () => {
  it('is idempotent: repeated calls return the same promise that resolves to the detail module', async () => {
    const first = preloadPokemonDetail()

    expect(preloadPokemonDetail()).toBe(first)
    const detailModule = await first
    expect(detailModule.default).toBeTypeOf('function')
  })
})
