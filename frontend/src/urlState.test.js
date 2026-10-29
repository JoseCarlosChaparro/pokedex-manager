import { describe, expect, it } from 'vitest'
import { DEFAULT_URL_STATE, buildSearch, parseUrlState } from './urlState'

describe('parseUrlState', () => {
  it('returns defaults for an empty query string', () => {
    expect(parseUrlState('')).toEqual(DEFAULT_URL_STATE)
  })

  it('reads page, type, search, open Pokémon and view', () => {
    expect(parseUrlState('?page=3&type=fire&q=char&pokemon=6&view=favorites')).toEqual({
      page: 3,
      type: 'fire',
      q: 'char',
      pokemon: '6',
      view: 'favorites',
    })
  })

  it('ignores invalid page numbers and unknown views', () => {
    expect(parseUrlState('?page=-2&view=hacker')).toEqual(DEFAULT_URL_STATE)
    expect(parseUrlState('?page=abc').page).toBe(1)
  })
})

describe('buildSearch', () => {
  it('omits default values', () => {
    expect(buildSearch(DEFAULT_URL_STATE)).toBe('')
  })

  it('round-trips through parseUrlState', () => {
    const state = { page: 2, type: 'water', q: '', pokemon: '7', view: 'all' }

    expect(parseUrlState(buildSearch(state))).toEqual(state)
  })
})
