import { describe, expect, it } from 'vitest'
import { activeFilterCount, filterPokedex, generationOf, paginate } from './pokedexFilter'

const INDEX = [
  { id: 1, name: 'bulbasaur', types: ['grass', 'poison'] },
  { id: 4, name: 'charmander', types: ['fire'] },
  { id: 6, name: 'charizard', types: ['fire', 'flying'] },
  { id: 25, name: 'pikachu', types: ['electric'] },
  { id: 172, name: 'pichu', types: ['electric'] },
  { id: 10080, name: 'pikachu-rock-star', types: ['electric'] },
]
const NO_FILTERS = { q: '', types: [], gen: '', sort: 'id' }
const names = (list) => list.map((p) => p.name)

describe('filterPokedex', () => {
  it('returns everything in Pokédex order without filters', () => {
    expect(filterPokedex(INDEX, NO_FILTERS)).toHaveLength(6)
  })

  it('matches part of the name, ignoring case, accents and spaces', () => {
    expect(names(filterPokedex(INDEX, { ...NO_FILTERS, q: ' CHAR ' }))).toEqual(['charmander', 'charizard'])
    expect(names(filterPokedex(INDEX, { ...NO_FILTERS, q: 'píkachu rock' }))).toEqual(['pikachu-rock-star'])
  })

  it('matches the Pokédex number, with or without #', () => {
    expect(names(filterPokedex(INDEX, { ...NO_FILTERS, q: '#25' }))).toEqual(['pikachu'])
    expect(names(filterPokedex(INDEX, { ...NO_FILTERS, q: '17' }))).toEqual(['pichu'])
  })

  it('requires every selected type', () => {
    expect(names(filterPokedex(INDEX, { ...NO_FILTERS, types: ['fire'] }))).toEqual(['charmander', 'charizard'])
    expect(names(filterPokedex(INDEX, { ...NO_FILTERS, types: ['fire', 'flying'] }))).toEqual(['charizard'])
  })

  it('filters by generation, with alternate forms on their own', () => {
    expect(names(filterPokedex(INDEX, { ...NO_FILTERS, gen: '2' }))).toEqual(['pichu'])
    expect(names(filterPokedex(INDEX, { ...NO_FILTERS, gen: 'forms' }))).toEqual(['pikachu-rock-star'])
  })

  it('sorts by number or name in both directions', () => {
    expect(filterPokedex(INDEX, { ...NO_FILTERS, sort: '-id' })[0].id).toBe(10080)
    expect(filterPokedex(INDEX, { ...NO_FILTERS, sort: 'name' })[0].name).toBe('bulbasaur')
    expect(filterPokedex(INDEX, { ...NO_FILTERS, sort: '-name' })[0].name).toBe('pikachu-rock-star')
  })

  it('does not mutate the index', () => {
    filterPokedex(INDEX, { ...NO_FILTERS, sort: '-id' })
    expect(INDEX[0].id).toBe(1)
  })
})

describe('generationOf', () => {
  it('maps ids to generations', () => {
    expect(generationOf(151).id).toBe('1')
    expect(generationOf(152).id).toBe('2')
    expect(generationOf(1025).id).toBe('9')
    expect(generationOf(10080).id).toBe('forms')
  })
})

describe('paginate', () => {
  it('slices a page and clamps an out-of-range page to the last one', () => {
    const items = Array.from({ length: 50 }, (_, i) => i)

    expect(paginate(items, 2, 24)).toEqual({ page: 2, totalPages: 3, items: items.slice(24, 48) })
    expect(paginate(items, 99, 24).page).toBe(3)
    expect(paginate([], 1, 24)).toEqual({ page: 1, totalPages: 1, items: [] })
  })
})

describe('activeFilterCount', () => {
  it('counts nothing when no filter is set', () => {
    expect(activeFilterCount({ q: '', types: [], gen: '' })).toBe(0)
  })

  it('counts the search, each type and the generation', () => {
    expect(activeFilterCount({ q: ' pika ', types: ['fire', 'water'], gen: '1' })).toBe(4)
  })

  it('ignores a search that is only whitespace', () => {
    expect(activeFilterCount({ q: '   ', types: [], gen: '' })).toBe(0)
  })
})
