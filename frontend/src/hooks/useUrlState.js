import { useCallback, useEffect, useRef, useState } from 'react'
import { buildSearch, parseUrlState } from '../urlState'

// Reads navigation state from the query string and writes changes back as history entries.
export function useUrlState() {
  const [state, setState] = useState(() => parseUrlState(window.location.search))
  // Latest state without re-creating updateState; history is written outside setState (StrictMode-safe)
  const stateRef = useRef(state)

  useEffect(() => {
    const handlePopState = () => {
      stateRef.current = parseUrlState(window.location.search)
      setState(stateRef.current)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const updateState = useCallback((changes, { replace = false } = {}) => {
    const next = { ...stateRef.current, ...changes }
    const url = `${window.location.pathname}${buildSearch(next)}`
    if (replace) window.history.replaceState(null, '', url)
    else window.history.pushState(null, '', url)
    stateRef.current = next
    setState(next)
  }, [])

  return [state, updateState]
}
