import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '../api'

const UNAUTHORIZED = 401

// Every Pokémon with its types, loaded once; filtering then happens in the browser.
// The error is a translation key, so the view shows it in the current language.
export function usePokedexIndex({ onUnauthorized }) {
  const [state, setState] = useState({ index: [], isLoading: true, error: '' })
  const onUnauthorizedRef = useRef(onUnauthorized)
  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized
  }, [onUnauthorized])

  useEffect(() => {
    let isStale = false
    apiRequest('/api/pokemon/index')
      .then((index) => {
        if (!isStale) setState({ index, isLoading: false, error: '' })
      })
      .catch((err) => {
        if (err.status === UNAUTHORIZED) return onUnauthorizedRef.current()
        if (!isStale) setState({ index: [], isLoading: false, error: 'browser.indexError' })
      })
    return () => {
      isStale = true
    }
  }, [])

  return state
}
