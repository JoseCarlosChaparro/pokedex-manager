import { ArrowUpDown, Check, ChevronDown, Grid3x3, Layers, LayoutGrid, RotateCcw, Ruler, Search, SlidersHorizontal, Square, Tag } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '../i18n'
import { activeFilterCount, GENERATIONS, SORTS } from '../pokedexFilter'
import { POKEMON_TYPE_COLORS, POKEMON_TYPES, readableTextColor } from '../pokemonTypes'
import { DENSITIES } from '../urlState'

const DENSITY_ICONS = { compact: Grid3x3, comfy: LayoutGrid, large: Square }

function isTypingTarget(element) {
  return element instanceof HTMLElement && (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName))
}

const ANNOUNCE_DELAY_MS = 700

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

const panelClass = (isExpanded) => (isExpanded ? 'mt-3 space-y-3 md:block' : 'hidden mt-3 space-y-3 md:block')

function FilterSectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
      <Icon aria-hidden="true" className="size-4" />
      {children}
    </h3>
  )
}

// Every change applies instantly (client-side filtering over the Pokédex index)
export default function FilterBar({ filters, resultCount, onChange }) {
  const { t, i18n } = useTranslation()
  const searchRef = useRef(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const headingId = useId()
  const panelId = useId()
  const announcedCount = useDebouncedValue(resultCount, ANNOUNCE_DELAY_MS)
  const activeCount = activeFilterCount(filters)
  const formatCount = (count) => t('filters.count', { count, number: formatNumber(i18n.language, count) })

  useEffect(() => {
    function handleShortcut(event) {
      if (event.key !== '/' || isTypingTarget(document.activeElement) || document.querySelector('dialog[open]')) return
      event.preventDefault()
      // Render the panel first: a display:none input cannot take focus
      flushSync(() => setIsExpanded(true))
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  function toggleType(type) {
    const types = filters.types.includes(type) ? filters.types.filter((selected) => selected !== type) : [...filters.types, type]
    onChange({ types })
  }

  return (
    <section aria-labelledby={headingId} className="mb-6 rounded-3xl bg-white/80 p-4 ring-1 ring-slate-300/70 backdrop-blur dark:bg-slate-900/70 dark:ring-slate-700">
      <header className="flex items-center gap-2">
        <h2 id={headingId} className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
          <SlidersHorizontal aria-hidden="true" className="size-5" />
          {t('filters.title')}
        </h2>
        {activeCount > 0 && (
          <span className="rounded-full bg-brand-600 px-2 text-xs font-bold text-white dark:bg-brand-400 dark:text-slate-950">{activeCount}</span>
        )}
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={panelId}
          aria-label={t('filters.active', { count: activeCount })}
          onClick={() => setIsExpanded((open) => !open)}
          className="ml-auto grid min-h-11 min-w-11 place-items-center rounded-xl ring-1 ring-slate-300/70 md:hidden dark:ring-slate-600"
        >
          <ChevronDown aria-hidden="true" className={`size-5 transition-transform motion-reduce:transition-none ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </header>

      <div id={panelId} className={panelClass(isExpanded)}>
        <div className="relative">
          <label htmlFor="pokemon-search" className="sr-only">
            {t('filters.search')}
          </label>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input
            ref={searchRef}
            id="pokemon-search"
            type="search"
            value={filters.q}
            onChange={(event) => onChange({ q: event.target.value }, { replace: true })}
            placeholder={t('filters.searchPlaceholder')}
            autoComplete="off"
            className={`${fieldClass} w-full pr-9 pl-9 text-base`}
          />
          <kbd aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-slate-300 px-1.5 text-xs text-slate-500 sm:block dark:border-slate-600 dark:text-slate-400">
            /
          </kbd>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <FilterSectionTitle icon={Layers}>{t('filters.generation')}</FilterSectionTitle>
            <select aria-label={t('filters.generation')} value={filters.gen} onChange={(e) => onChange({ gen: e.target.value })} className={`${fieldClass} w-full`}>
              <option value="">{t('filters.allGenerations')}</option>
              {GENERATIONS.map((gen) => (
                <option key={gen.id} value={gen.id}>
                  {t(`generations.${gen.id}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FilterSectionTitle icon={ArrowUpDown}>{t('filters.sort')}</FilterSectionTitle>
            <select aria-label={t('filters.sort')} value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })} className={`${fieldClass} w-full`}>
              {Object.keys(SORTS).map((key) => (
                <option key={key} value={key}>
                  {t(`sorts.${key}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <FilterSectionTitle icon={Ruler}>{t('filters.cardSize')}</FilterSectionTitle>
            <div role="group" aria-label={t('filters.cardSize')} className="flex rounded-xl bg-white/60 p-1 ring-1 ring-slate-300/70 backdrop-blur dark:bg-slate-800/60 dark:ring-slate-600">
              {DENSITIES.map((density) => {
                const DensityIcon = DENSITY_ICONS[density]
                const label = t(`density.${density}`)
                return (
                  <button
                    key={density}
                    type="button"
                    aria-pressed={filters.density === density}
                    aria-label={t('filters.densityButton', { density: label })}
                    title={label}
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

        <div>
          <FilterSectionTitle icon={Tag}>{t('filters.byType')}</FilterSectionTitle>
          <div role="group" aria-label={t('filters.byType')} className="flex flex-wrap gap-1.5">
            {POKEMON_TYPES.map((type) => {
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
                  {t(`types.${type}`)}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <footer className="mt-3 flex min-h-9 items-center justify-between gap-2 text-sm">
        <p className="font-medium text-slate-700 dark:text-slate-300">{formatCount(resultCount)}</p>
        <p aria-live="polite" className="sr-only">
          {formatCount(announcedCount)}
        </p>
        {activeCount > 0 && (
          <button type="button" onClick={() => onChange({ q: '', types: [], gen: '' })} className="min-h-9 rounded-lg px-2 underline">
            <RotateCcw aria-hidden="true" className="mr-1 inline size-4" />
            {t('filters.clear')}
          </button>
        )}
      </footer>
    </section>
  )
}
