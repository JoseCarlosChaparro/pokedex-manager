import { lazy } from 'react'

// The single place where the browser and the detail dialog become separate chunks. The logged-out
// page imports none of them, so it never downloads the browser code or GSAP.

// Memoized so every preload and the first React.lazy render share one request and one module.
let pokemonDetailModule = null

export function preloadPokemonDetail() {
  pokemonDetailModule ??= import('./components/PokemonDetail')
  return pokemonDetailModule
}

export const LazyPokemonDetail = lazy(preloadPokemonDetail)
export const LazyPokemonBrowser = lazy(() => import('./components/PokemonBrowser'))
