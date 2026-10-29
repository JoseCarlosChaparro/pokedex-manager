import { lazy } from 'react'

// The single place where the browser and the detail dialog become separate chunks. The logged-out
// page imports none of them, so it never downloads the browser code or GSAP.

// Memoized so every preload and the first React.lazy render share one request and one module.
// A failed import is forgotten, so the next call tries the download again.
export function createPreloader(importer) {
  let pending = null
  return function preload() {
    pending ??= importer().catch((error) => {
      pending = null
      throw error
    })
    return pending
  }
}

export const preloadPokemonDetail = createPreloader(() => import('./components/PokemonDetail'))

export const LazyPokemonDetail = lazy(preloadPokemonDetail)
export const LazyPokemonBrowser = lazy(() => import('./components/PokemonBrowser'))
