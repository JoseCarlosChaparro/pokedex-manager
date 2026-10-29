import { flushSync } from 'react-dom'

const SHARED_ELEMENT_NAME = 'pokemon-art'

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Morphs one image into another across a React update (View Transitions API); plain update when
// unsupported or when the user prefers reduced motion. Resolves once the DOM is updated.
export function morphImage(update, { from, to }) {
  if (!document.startViewTransition || prefersReducedMotion()) {
    update()
    return Promise.resolve()
  }
  if (from) from.style.viewTransitionName = SHARED_ELEMENT_NAME
  const transition = document.startViewTransition(() => {
    if (from) from.style.viewTransitionName = ''
    flushSync(update)
    const target = to()
    if (target) target.style.viewTransitionName = SHARED_ELEMENT_NAME
  })
  transition.finished.finally(() => {
    const target = to()
    if (target) target.style.viewTransitionName = ''
  })
  return transition.updateCallbackDone
}
