import { describe, expect, it, vi } from 'vitest'
import { createPreloader, preloadPokemonDetail } from './lazyComponents'

describe('preloadPokemonDetail', () => {
  it('is idempotent: repeated calls return the same promise that resolves to the detail module', async () => {
    const first = preloadPokemonDetail()

    expect(preloadPokemonDetail()).toBe(first)
    const detailModule = await first
    expect(detailModule.default).toBeTypeOf('function')
  })
})

describe('createPreloader', () => {
  it('retries after a failed import', async () => {
    const detailModule = { default: () => null }
    const importer = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(detailModule)
    const preload = createPreloader(importer)

    await expect(preload()).rejects.toThrow('offline')
    await expect(preload()).resolves.toBe(detailModule)
    expect(importer).toHaveBeenCalledTimes(2)
  })
})
