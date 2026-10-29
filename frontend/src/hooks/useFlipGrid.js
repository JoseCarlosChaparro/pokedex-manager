import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { useCallback, useLayoutEffect, useRef } from 'react'
import { prefersReducedMotion } from '../viewTransition'

gsap.registerPlugin(Flip)

const FLIP_SELECTOR = '[data-flip-id]'

// FLIP layout animation for the gallery: call capture() right before changing filters/density;
// after React renders, items glide from their old position and new ones pop in.
export function useFlipGrid(containerRef, layoutKey) {
  const stateRef = useRef(null)

  const capture = useCallback(() => {
    if (prefersReducedMotion() || !containerRef.current) return
    stateRef.current = Flip.getState(containerRef.current.querySelectorAll(FLIP_SELECTOR))
  }, [containerRef])

  useLayoutEffect(() => {
    const state = stateRef.current
    stateRef.current = null
    if (!state || !containerRef.current) return undefined
    const animation = Flip.from(state, {
      targets: containerRef.current.querySelectorAll(FLIP_SELECTOR),
      duration: 0.55,
      ease: 'power3.inOut',
      stagger: 0.012,
      absolute: false,
      onEnter: (elements) =>
        gsap.fromTo(elements, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.015, ease: 'back.out(1.6)' }),
    })
    return () => animation.kill()
  }, [layoutKey, containerRef])

  return capture
}
