import { useEffect, useState } from 'react'
import { apiRequest } from '../api'

const PAGE_SIZE = 10
const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

// PokéAPI list items only carry name + url; the id is the url's last path segment
function getIdFromUrl(url) {
  return url.split('/').filter(Boolean).pop()
}

export default function PokemonBrowser({ onUnauthorized }) {
  const [offset, setOffset] = useState(0)
  const [page, setPage] = useState({ count: 0, results: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Ignore responses that arrive after the user already moved to another page
    let isStale = false
    apiRequest(`/api/pokemon?limit=${PAGE_SIZE}&offset=${offset}`)
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
  }, [offset, onUnauthorized])

  function goToOffset(newOffset) {
    setLoading(true)
    setError('')
    setOffset(newOffset)
  }

  const currentPage = offset / PAGE_SIZE + 1
  const totalPages = Math.ceil(page.count / PAGE_SIZE)

  return (
    <section className="mx-auto max-w-6xl p-4">
      {error && <p role="alert" className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</p>}

      {loading ? (
        <p className="py-10 text-center text-slate-500">Cargando…</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {page.results.map((pokemon) => {
            const id = getIdFromUrl(pokemon.url)
            return (
              <li key={pokemon.name} className="rounded-xl bg-white p-3 text-center shadow">
                <img src={`${SPRITE_BASE_URL}/${id}.png`} alt={pokemon.name} loading="lazy" className="mx-auto h-24 w-24" />
                <p className="text-sm text-slate-500">#{id}</p>
                <p className="font-semibold capitalize">{pokemon.name}</p>
              </li>
            )
          })}
        </ul>
      )}

      <nav className="mt-6 flex items-center justify-center gap-4">
        <button disabled={offset === 0} onClick={() => goToOffset(offset - PAGE_SIZE)}
          className="rounded bg-white px-4 py-2 shadow disabled:opacity-40">Anterior</button>
        <span className="text-sm">Página {currentPage} de {totalPages || 1}</span>
        <button disabled={currentPage >= totalPages} onClick={() => goToOffset(offset + PAGE_SIZE)}
          className="rounded bg-white px-4 py-2 shadow disabled:opacity-40">Siguiente</button>
      </nav>
    </section>
  )
}
