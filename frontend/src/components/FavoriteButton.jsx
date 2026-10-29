// Toggle button: aria-pressed tells screen readers the state; the heart shape is not the only signal.
export default function FavoriteButton({ pokemon, isFavorite, onToggle, className = '' }) {
  const name = pokemon.name.replaceAll('-', ' ')
  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Quitar a ${name} de mi colección` : `Agregar a ${name} a mi colección`}
      title={isFavorite ? 'En tu colección' : 'Agregar a tu colección'}
      onClick={(event) => {
        event.stopPropagation()
        onToggle(pokemon)
      }}
      className={`grid h-11 w-11 place-items-center rounded-full bg-white/90 shadow-sm transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-red-600 motion-reduce:transition-none motion-reduce:hover:scale-100 dark:bg-slate-900/80 ${className}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-6 w-6 ${isFavorite ? 'fill-red-600 stroke-red-600' : 'fill-none stroke-slate-500 dark:stroke-slate-300'}`} strokeWidth="2">
        <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.3 5 6.8 5c2 0 3.5 1.1 5.2 3 1.7-1.9 3.2-3 5.2-3 3.5 0 5.6 3.6 4.3 6.8C19.5 16.4 12 21 12 21z" />
      </svg>
    </button>
  )
}
