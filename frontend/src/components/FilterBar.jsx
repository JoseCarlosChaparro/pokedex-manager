import { Check, Grid3x3, LayoutGrid, RotateCcw, Search, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { GENERATIONS, SORTS } from '../pokedexFilter'
import { POKEMON_TYPE_COLORS, POKEMON_TYPE_LABELS, readableTextColor } from '../pokemonTypes'
import { DENSITIES } from '../urlState'

const DENSITY_LABELS = { compact: 'Compacta', comfy: 'Normal', large: 'Grande' }
const DENSITY_ICONS = { compact: Grid3x3, comfy: LayoutGrid, large: Square }

function isTypingTarget(element) {
  return element instanceof HTMLElement && (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName))
}

const ANNOUNCE_DELAY_MS = 700

const formatCount = (count) => (count === 1 ? '1 Pokémon' : `${count.toLocaleString('es-MX')} Pokémon`)

// Screen readers hear the result count once typing pauses, not on every keystroke
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

const fieldClass =
  'min-h-11 rounded-xl bg-white/80 px-3 ring-1 ring-slate-300/70 backdrop-blur dark:bg-slate-800/80 dark:ring-slate-600'

// Every change applies instantly (client-side filtering over the Pokédex index)
export default function FilterBar({ filters, resultCount, onChange }) {
  const searchRef = useRef(null)
  const announcedCount = useDebouncedValue(resultCount, ANNOUNCE_DELAY_MS)

  useEffect(() => {
    function handleShortcut(event) {
      if (event.key !== '/' || isTypingTarget(document.activeElement) || document.querySelector('dialog[open]')) return
      event.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  function toggleType(type) {
    const types = filters.types.includes(type) ? filters.types.filter((t) => t !== type) : [...filters.types, type]
    onChange({ types })
  }

  const hasFilters = filters.q || filters.types.length || filters.gen

  return (
    <section aria-label="Filtros" className="mb-6 space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row">
        <div className="relative flex-1">
          <label htmlFor="pokemon-search" className="sr-only">
            Buscar Pokémon
          </label>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input
            ref={searchRef}
            id="pokemon-search"
            type="search"
            value={filters.q}
            onChange={(event) => onChange({ q: event.target.value }, { replace: true })}
            placeholder="Busca por nombre o número… (pika, #25)"
            autoComplete="off"
            className={`${fieldClass} w-full pr-9 pl-9 text-base`}
          />
          <kbd aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-slate-300 px-1.5 text-xs text-slate-500 sm:block dark:border-slate-600 dark:text-slate-400">
            /
          </kbd>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select aria-label="Generación" value={filters.gen} onChange={(e) => onChange({ gen: e.target.value })} className={fieldClass}>
            <option value="">Todas las generaciones</option>
            {GENERATIONS.map((gen) => (
              <option key={gen.id} value={gen.id}>
                {gen.label}
              </option>
            ))}
          </select>
          <select aria-label="Ordenar" value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })} className={fieldClass}>
            {Object.entries(SORTS).map(([key, sort]) => (
              <option key={key} value={key}>
                {sort.label}
              </option>
            ))}
          </select>
          <div role="group" aria-label="Tamaño de las tarjetas" className="col-span-2 flex rounded-xl bg-white/60 p-1 ring-1 ring-slate-300/70 backdrop-blur dark:bg-slate-800/60 dark:ring-slate-600">
            {DENSITIES.map((density) => {
              const DensityIcon = DENSITY_ICONS[density]
              return (
                <button
                  key={density}
                  type="button"
                  aria-pressed={filters.density === density}
                  aria-label={`Tarjetas: ${DENSITY_LABELS[density]}`}
                  title={DENSITY_LABELS[density]}
                  onClick={() => onChange({ density })}
                  className="grid min-h-9 flex-1 place-items-center rounded-lg px-3 aria-pressed:bg-brand-600 aria-pressed:text-white dark:aria-pressed:bg-brand-400 dark:aria-pressed:text-slate-950"
                >
                  <DensityIcon className="size-5" />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div role="group" aria-label="Filtrar por tipo" className="flex flex-wrap gap-1.5">
        {Object.entries(POKEMON_TYPE_LABELS).map(([type, label]) => {
          const color = POKEMON_TYPE_COLORS[type]
          const isSelected = filters.types.includes(type)
          return (
            <button
              key={type}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleType(type)}
              style={isSelected ? { backgroundColor: color, color: readableTextColor(color), borderColor: color } : { borderColor: color }}
              className="type-chip min-h-9 rounded-full border-2 bg-white/70 px-3 text-sm font-semibold backdrop-blur transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:bg-slate-800/70"
            >
              {isSelected && <Check aria-hidden="true" className="mr-1 inline size-4" />}
              {label}
            </button>
          )
        })}
      </div>

      <div className="flex min-h-9 items-center justify-between gap-2 text-sm">
        <p className="font-medium text-slate-700 dark:text-slate-300">{formatCount(resultCount)}</p>
        <p aria-live="polite" className="sr-only">
          {formatCount(announcedCount)}
        </p>
        {hasFilters && (
          <button type="button" onClick={() => onChange({ q: '', types: [], gen: '' })} className="min-h-9 rounded-lg px-2 underline">
            <RotateCcw aria-hidden="true" className="mr-1 inline size-4" />
            Limpiar filtros
          </button>
        )}
      </div>
    </section>
  )
}
