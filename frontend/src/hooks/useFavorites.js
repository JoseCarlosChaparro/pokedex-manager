import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../api'

const FAVORITES_PATH = '/api/me/favorites'
const UNAUTHORIZED = 401

// The user's personal collection. Changes show instantly (optimistic) and roll back if the server fails.
export function useFavorites({ onUnauthorized }) {
  const [favorites, setFavorites] = useState([])
  const [error, setError] = useState('')

  // Latest callback without re-running the load effect when the parent passes a new function
  const onUnauthorizedRef = useRef(onUnauthorized)
  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized
  }, [onUnauthorized])

  const handleError = useCallback((err, message) => {
    if (err.status === UNAUTHORIZED) onUnauthorizedRef.current()
    else setError(message)
  }, [])

  useEffect(() => {
    let isStale = false
    apiRequest(FAVORITES_PATH)
      .then((data) => {
        if (!isStale) setFavorites(data.map(({ pokemon_id, name, opened }) => ({ id: pokemon_id, name, opened: Boolean(opened) })))
      })
      .catch((err) => {
        if (!isStale) handleError(err, 'No pudimos cargar tu colección.')
      })
    return () => {
      isStale = true
    }
  }, [handleError])

  const isFavorite = useCallback((id) => favorites.some((favorite) => favorite.id === Number(id)), [favorites])

  const toggleFavorite = useCallback(
    async (pokemon) => {
      const id = Number(pokemon.id)
      const wasFavorite = favorites.some((favorite) => favorite.id === id)
      const previous = favorites
      setError('')
      setFavorites(wasFavorite ? favorites.filter((f) => f.id !== id) : [...favorites, { id, name: pokemon.name, opened: false }])
      try {
        await apiRequest(`${FAVORITES_PATH}/${id}`, { method: wasFavorite ? 'DELETE' : 'PUT' })
      } catch (err) {
        setFavorites(previous)
        handleError(err, 'No pudimos actualizar tu colección. Intenta de nuevo.')
      }
    },
    [favorites, handleError],
  )

  // Opening a sealed pack is remembered on the server; shown at once, rolled back on failure
  const openPack = useCallback(
    async (pokemon) => {
      const id = Number(pokemon.id)
      const setOpened = (opened) =>
        setFavorites((current) => current.map((favorite) => (favorite.id === id ? { ...favorite, opened } : favorite)))
      setOpened(true)
      try {
        await apiRequest(`${FAVORITES_PATH}/${id}/open`, { method: 'POST' })
      } catch (err) {
        setOpened(false)
        handleError(err, 'No pudimos abrir el sobre. Intenta de nuevo.')
      }
    },
    [handleError],
  )

  return { favorites, isFavorite, toggleFavorite, openPack, error }
}
