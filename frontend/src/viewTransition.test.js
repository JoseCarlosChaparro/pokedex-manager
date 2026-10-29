import { describe, expect, it } from 'vitest'
import { VIEWS } from './urlState'
import { viewDirection } from './viewTransition'

describe('viewDirection', () => {
  it('moves right from the Pokédex to the collection and left back', () => {
    expect(viewDirection(VIEWS.all, VIEWS.favorites)).toBe(1)
    expect(viewDirection(VIEWS.favorites, VIEWS.all)).toBe(-1)
  })

  it('does not move when the view stays the same', () => {
    expect(viewDirection(VIEWS.all, VIEWS.all)).toBe(0)
  })
})
