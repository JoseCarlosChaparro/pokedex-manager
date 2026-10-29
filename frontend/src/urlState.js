// The browser URL is the source of truth for navigation: links can be shared and Back/Forward work.
export const VIEWS = { all: 'all', favorites: 'favorites' }
export const DENSITIES = ['compact', 'comfy', 'large']
const SORT_KEYS = ['id', '-id', 'name', '-name']
const LIST_SEPARATOR = ','

export const DEFAULT_URL_STATE = {
  page: 1,
  q: '',
  types: [],
  gen: '',
  sort: 'id',
  density: 'comfy',
  pokemon: null,
  view: VIEWS.all,
}

function parsePage(value) {
  const page = Number.parseInt(value, 10)
  return Number.isInteger(page) && page > 0 ? page : DEFAULT_URL_STATE.page
}

const oneOf = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback)

export function parseUrlState(search) {
  const params = new URLSearchParams(search)
  const types = params.get('types')
  return {
    page: parsePage(params.get('page')),
    q: params.get('q') ?? DEFAULT_URL_STATE.q,
    types: types ? types.split(LIST_SEPARATOR).filter(Boolean) : DEFAULT_URL_STATE.types,
    gen: params.get('gen') ?? DEFAULT_URL_STATE.gen,
    sort: oneOf(params.get('sort'), SORT_KEYS, DEFAULT_URL_STATE.sort),
    density: oneOf(params.get('density'), DENSITIES, DEFAULT_URL_STATE.density),
    pokemon: params.get('pokemon') ?? DEFAULT_URL_STATE.pokemon,
    view: oneOf(params.get('view'), Object.values(VIEWS), DEFAULT_URL_STATE.view),
  }
}

function serialize(value) {
  return Array.isArray(value) ? value.join(LIST_SEPARATOR) : String(value)
}

export function buildSearch(state) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(state)) {
    const text = value === null ? '' : serialize(value)
    if (text && text !== serialize(DEFAULT_URL_STATE[key] ?? '')) params.set(key, text)
  }
  const search = params.toString()
  return search ? `?${search}` : ''
}
