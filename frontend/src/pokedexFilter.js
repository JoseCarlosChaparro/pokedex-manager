// Client-side filtering over the full Pokédex index: instant results while typing or toggling filters.
export const GENERATIONS = [
  { id: '1', label: 'I · Kanto', min: 1, max: 151 },
  { id: '2', label: 'II · Johto', min: 152, max: 251 },
  { id: '3', label: 'III · Hoenn', min: 252, max: 386 },
  { id: '4', label: 'IV · Sinnoh', min: 387, max: 493 },
  { id: '5', label: 'V · Teselia', min: 494, max: 649 },
  { id: '6', label: 'VI · Kalos', min: 650, max: 721 },
  { id: '7', label: 'VII · Alola', min: 722, max: 809 },
  { id: '8', label: 'VIII · Galar', min: 810, max: 905 },
  { id: '9', label: 'IX · Paldea', min: 906, max: 1025 },
  { id: 'forms', label: 'Formas alternas', min: 1026, max: Number.POSITIVE_INFINITY },
]

export const SORTS = {
  id: { label: 'Número ↑', compare: (a, b) => a.id - b.id },
  '-id': { label: 'Número ↓', compare: (a, b) => b.id - a.id },
  name: { label: 'Nombre A–Z', compare: (a, b) => a.name.localeCompare(b.name) },
  '-name': { label: 'Nombre Z–A', compare: (a, b) => b.name.localeCompare(a.name) },
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
