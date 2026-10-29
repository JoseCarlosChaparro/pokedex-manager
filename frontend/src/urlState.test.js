import { describe, expect, it } from 'vitest'
import { DEFAULT_URL_STATE, buildSearch, parseUrlState } from './urlState'

describe('parseUrlState', () => {
  it('returns defaults for an empty query string', () => {
    expect(parseUrlState('')).toEqual(DEFAULT_URL_STATE)
  })

  it('reads every filter', () => {
    expect(parseUrlState('?page=3&q=char&types=fire,flying&gen=1&sort=-id&density=large&pokemon=6&view=favorites')).toEqual({
      page: 3,
      q: 'char',
      types: ['fire', 'flying'],
      gen: '1',
      sort: '-id',
      density: 'large',
      pokemon: '6',
      view: 'favorites',
    })
  })

  it('ignores invalid values', () => {
    expect(parseUrlState('?page=-2&view=hacker&sort=evil&density=huge')).toEqual(DEFAULT_URL_STATE)
    expect(parseUrlState('?page=abc').page).toBe(1)
  })
})

describe('buildSearch', () => {
  it('omits default values', () => {
    expect(buildSearch(DEFAULT_URL_STATE)).toBe('')
  })

  it('round-trips through parseUrlState', () => {
    const state = { ...DEFAULT_URL_STATE, page: 2, types: ['water', 'ice'], pokemon: '7' }

    expect(parseUrlState(buildSearch(state))).toEqual(state)
  })
})
