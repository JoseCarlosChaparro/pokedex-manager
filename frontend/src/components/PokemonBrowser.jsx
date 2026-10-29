import { useEffect, useState } from 'react'
import { apiRequest } from '../api'

const PAGE_SIZE = 10
const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

const POKEMON_TYPE_LABELS = {
  normal: 'Normal', fire: 'Fuego', water: 'Agua', grass: 'Planta',
  electric: 'Eléctrico', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
  ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
  rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro',
  steel: 'Acero', fairy: 'Hada',
}

// PokéAPI list items only carry name + url; the id is the url's last path segment
function getIdFromUrl(url) {
  return url.split('/').filter(Boolean).pop()
}

export default function PokemonBrowser({ onUnauthorized }) {
  const [offset, setOffset] = useState(0)
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState({ count: 0, results: [] })
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Ignore responses that arrive after the user already moved to another page or type
    let isStale = false
    const listPath = typeFilter ? `/api/pokemon/type/${typeFilter}` : '/api/pokemon'
    apiRequest(`${listPath}?limit=${PAGE_SIZE}&offset=${offset}`)
      .then((data) => {
        if (!isStale) setPage(data)
      })
      .catch((err) => {
        if (err.status === 401) onUnauthorized()
        else if (!isStale) setError('No pudimos cargar los Pokémon. Intenta de nuevo.')
      })
      .finally(() => {
        if (!isStale) setLoading(false)
      })
    return () => {
      isStale = true
    }
  }, [offset, typeFilter, onUnauthorized])

  function goToOffset(newOffset) {
    setLoading(true)
    setError('')
    setOffset(newOffset)
  }

  function clearSearch() {
    setSearchTerm('')
    setSearchResult(null)
    setError('')
  }

  function handleTypeChange(event) {
    clearSearch()
    setTypeFilter(event.target.value)
    goToOffset(0)
  }

  async function handleSearch(event) {
    event.preventDefault()
    setError('')
    try {
      const pokemon = await apiRequest(`/api/pokemon/search?name=${encodeURIComponent(searchTerm)}`)
      setSearchResult(pokemon)
    } catch (err) {
      if (err.status === 401) return onUnauthorized()
      setSearchResult(null)
      setError(err.status === 404 ? `No encontramos "${searchTerm}".` : 'La búsqueda falló. Intenta de nuevo.')
    }
  }

  const visiblePokemon = searchResult
    ? [{ id: searchResult.id, name: searchResult.name }]
    : page.results.map((pokemon) => ({ id: getIdFromUrl(pokemon.url), name: pokemon.name }))
  const currentPage = offset / PAGE_SIZE + 1
  const totalPages = Math.ceil(page.count / PAGE_SIZE)

  return (
    <section className="mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            type="search" required value={searchTerm} placeholder="Buscar por nombre o número"
            aria-label="Buscar Pokémon" onChange={(e) => setSearchTerm(e.target.value)}
            className="min-w-0 flex-1 rounded border bg-white px-3 py-2"
          />
          <button className="rounded bg-red-500 px-4 py-2 font-semibold text-white">Buscar</button>
        </form>
        <select
          value={typeFilter} onChange={handleTypeChange} aria-label="Filtrar por tipo"
          className="rounded border bg-white px-3 py-2"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(POKEMON_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {error && <p role="alert" className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</p>}

      {searchResult && (
        <button onClick={clearSearch} className="mb-4 text-sm text-slate-600 underline">
          Limpiar búsqueda
        </button>
      )}

      {loading ? (
        <p className="py-10 text-center text-slate-500">Cargando…</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visiblePokemon.map((pokemon) => (
            <li key={pokemon.name} className="rounded-xl bg-white p-3 text-center shadow">
              <img src={`${SPRITE_BASE_URL}/${pokemon.id}.png`} alt={pokemon.name} loading="lazy" className="mx-auto h-24 w-24" />
              <p className="text-sm text-slate-500">#{pokemon.id}</p>
              <p className="font-semibold capitalize">{pokemon.name}</p>
            </li>
          ))}
        </ul>
      )}

      {!searchResult && (
        <nav className="mt-6 flex items-center justify-center gap-4">
          <button disabled={offset === 0} onClick={() => goToOffset(offset - PAGE_SIZE)}
            className="rounded bg-white px-4 py-2 shadow disabled:opacity-40">Anterior</button>
          <span className="text-sm">Página {currentPage} de {totalPages || 1}</span>
          <button disabled={currentPage >= totalPages} onClick={() => goToOffset(offset + PAGE_SIZE)}
            className="rounded bg-white px-4 py-2 shadow disabled:opacity-40">Siguiente</button>
        </nav>
      )}
    </section>
  )
}
