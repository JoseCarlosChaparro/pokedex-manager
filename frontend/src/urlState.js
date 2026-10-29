// The browser URL is the source of truth for navigation: links can be shared and Back/Forward work.
export const VIEWS = { all: 'all', favorites: 'favorites' }

export const DEFAULT_URL_STATE = { page: 1, type: '', q: '', pokemon: null, view: VIEWS.all }

function parsePage(value) {
  const page = Number.parseInt(value, 10)
  return Number.isInteger(page) && page > 0 ? page : DEFAULT_URL_STATE.page
}

export function parseUrlState(search) {
  const params = new URLSearchParams(search)
  const view = params.get('view')
  return {
    page: parsePage(params.get('page')),
    type: params.get('type') ?? DEFAULT_URL_STATE.type,
    q: params.get('q') ?? DEFAULT_URL_STATE.q,
    pokemon: params.get('pokemon') ?? DEFAULT_URL_STATE.pokemon,
    view: Object.values(VIEWS).includes(view) ? view : DEFAULT_URL_STATE.view,
  }
}

export function buildSearch(state) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(state)) {
    if (value !== DEFAULT_URL_STATE[key] && value !== null && value !== '') params.set(key, String(value))
  }
  const search = params.toString()
  return search ? `?${search}` : ''
}
