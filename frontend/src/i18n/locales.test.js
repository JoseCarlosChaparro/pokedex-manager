import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import es from './locales/es.json'

// Flattens nested translation objects into dotted keys: { a: { b: 'x' } } -> { 'a.b': 'x' }
function flatten(tree, prefix = '') {
  const entries = {}
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object') Object.assign(entries, flatten(value, path))
    else entries[path] = value
  }
  return entries
}

const keysOf = (tree) => Object.keys(flatten(tree)).sort()
const LOCALES = { es, en }

describe('translation locales', () => {
  it('es and en define exactly the same keys', () => {
    expect(keysOf(en)).toEqual(keysOf(es))
  })

  it('pairs every plural form with its _one and _other siblings in both locales', () => {
    for (const [name, tree] of Object.entries(LOCALES)) {
      const keys = keysOf(tree)
      for (const key of keys.filter((k) => k.endsWith('_one'))) {
        expect(keys, `${name}: ${key}`).toContain(key.replace(/_one$/, '_other'))
      }
      for (const key of keys.filter((k) => k.endsWith('_other'))) {
        expect(keys, `${name}: ${key}`).toContain(key.replace(/_other$/, '_one'))
      }
    }
  })

  it('no value is empty', () => {
    for (const [name, tree] of Object.entries(LOCALES)) {
      for (const [key, value] of Object.entries(flatten(tree))) {
        expect(value.trim(), `${name}: ${key}`).not.toBe('')
      }
    }
  })
})
