// Client-side filtering over the full Pokédex index: instant results while typing or toggling filters.
// Generation ids are translation keys (generations.<id>); labels live in the locale files
export const GENERATIONS = [
  { id: '1', min: 1, max: 151 },
  { id: '2', min: 152, max: 251 },
  { id: '3', min: 252, max: 386 },
  { id: '4', min: 387, max: 493 },
  { id: '5', min: 494, max: 649 },
  { id: '6', min: 650, max: 721 },
  { id: '7', min: 722, max: 809 },
  { id: '8', min: 810, max: 905 },
  { id: '9', min: 906, max: 1025 },
  { id: 'forms', min: 1026, max: Number.POSITIVE_INFINITY },
]

// Sort keys are translation keys (sorts.<key>)
export const SORTS = {
  id: { compare: (a, b) => a.id - b.id },
  '-id': { compare: (a, b) => b.id - a.id },
  name: { compare: (a, b) => a.name.localeCompare(b.name) },
  '-name': { compare: (a, b) => b.name.localeCompare(a.name) },
}

export const generationOf = (id) => GENERATIONS.find((gen) => id >= gen.min && id <= gen.max)

// Sort and density only reorder or restyle the list, so they never count as filters
export function activeFilterCount({ q, types, gen }) {
  return (q.trim() ? 1 : 0) + types.length + (gen ? 1 : 0)
}

// "Píkachu Rock" -> "pikachu-rock": PokéAPI names are lowercase, unaccented and hyphenated
function normalize(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, '-')
}

function matchesText(pokemon, query) {
  if (!query) return true
  const number = query.replace(/^#/, '')
  if (/^\d+$/.test(number)) return String(pokemon.id).startsWith(number)
  return pokemon.name.includes(query)
}

export function filterPokedex(index, { q, types, gen, sort }) {
  const query = normalize(q)
  const generation = GENERATIONS.find((g) => g.id === gen)
  const compare = (SORTS[sort] ?? SORTS.id).compare
  return index
    .filter(
      (pokemon) =>
        matchesText(pokemon, query) &&
        types.every((type) => pokemon.types.includes(type)) &&
        (!generation || (pokemon.id >= generation.min && pokemon.id <= generation.max)),
    )
    .sort(compare)
}

export function paginate(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  return { page: safePage, totalPages, items: items.slice((safePage - 1) * pageSize, safePage * pageSize) }
}
