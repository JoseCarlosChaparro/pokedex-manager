import { Heart } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const BURST_PARTICLES = 8

// Toggle button: aria-pressed tells screen readers the state; the heart shape is not the only signal.
// Adding plays a small heart burst (CSS, hidden under reduced motion).
export default function FavoriteButton({ pokemon, isFavorite, onToggle, className = 'relative' }) {
  const { t } = useTranslation()
  const [burstKey, setBurstKey] = useState(0)
  const name = pokemon.name.replaceAll('-', ' ')

  function handleClick(event) {
    event.stopPropagation()
    if (!isFavorite) setBurstKey((key) => key + 1)
    onToggle(pokemon, event.currentTarget)
  }

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={isFavorite ? t('browser.favoriteRemove', { name }) : t('browser.favoriteAdd', { name })}
      title={isFavorite ? t('browser.inCollection') : t('browser.addToCollection')}
      onClick={handleClick}
      className={`favorite-button grid h-11 w-11 place-items-center rounded-full bg-white/90 shadow-sm transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-brand-600 dark:focus-visible:outline-brand-400 motion-reduce:transition-none motion-reduce:hover:scale-100 dark:bg-slate-900/80 ${className}`}
    >
      <Heart
        aria-hidden="true"
        fill={isFavorite ? 'currentColor' : 'none'}
        className={`h-6 w-6 ${isFavorite ? 'favorite-button__heart--on text-brand-500 fill-current stroke-current' : 'fill-none stroke-slate-600 dark:stroke-slate-300'}`}
      />
      {burstKey > 0 && (
        <span key={burstKey} aria-hidden="true" className="favorite-burst">
          {Array.from({ length: BURST_PARTICLES }, (_, index) => (
            <span key={index} style={{ '--angle': `${(360 / BURST_PARTICLES) * index}deg` }} />
          ))}
        </span>
      )}
    </button>
  )
}
