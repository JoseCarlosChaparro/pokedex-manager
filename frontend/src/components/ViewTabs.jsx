import { BookOpen, Library } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '../i18n'
import { CONTAINER_CLASS } from '../layout'
import { VIEWS } from '../urlState'

const TAB_ICONS = { [VIEWS.all]: BookOpen, [VIEWS.favorites]: Library }
// The indicator is one pill as wide as a tab; moving it by its own width lands on the second tab
const INDICATOR_OFFSET = { [VIEWS.all]: 'translate-x-0', [VIEWS.favorites]: 'translate-x-full' }
const SUBTITLE_SEPARATOR = ' · '
const TAB_ICON_CLASS = 'hidden size-4.5 shrink-0 sm:block'

// The visible number is hidden from assistive tech; spokenText is only set when no other visible text says it
function SealedBadge({ count, spokenText }) {
  return (
    <span
      data-sealed-badge
      className="pointer-events-none absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-amber-400 px-1 text-xs font-bold text-slate-900 tabular-nums motion-safe:animate-pulse"
    >
      <span aria-hidden="true">{count}</span>
      {spokenText && <span className="sr-only">{spokenText}</span>}
    </span>
  )
}

// The name is the visible label, plus the count in brackets when spokenCount is set ("Mi colección (3)").
// The count sits in sr-only text, not in aria-label: an aria-label would hide the visible chip from the name.
function ViewTab({ view, label, chip, spokenCount, isPressed, onSelect, badge }) {
  const Icon = TAB_ICONS[view]
  return (
    <div className="relative">
      <button
        type="button"
        aria-pressed={isPressed}
        data-collection-target={view === VIEWS.favorites ? '' : undefined}
        onClick={() => onSelect(view)}
        className="relative z-10 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-semibold whitespace-nowrap text-slate-700 aria-pressed:text-white dark:text-slate-300 dark:aria-pressed:text-slate-950"
      >
        <Icon aria-hidden="true" className={TAB_ICON_CLASS} />
        <span>{label}</span>
        {chip !== null && (
          <span aria-hidden="true" className="min-w-6 rounded-md bg-slate-900/10 px-1.5 text-xs tabular-nums dark:bg-white/10">
            {chip}
          </span>
        )}
        {spokenCount !== undefined && (
          <>
            {' '}
            <span className="sr-only">({spokenCount})</span>
          </>
        )}
      </button>
      {badge}
    </div>
  )
}

export default function ViewTabs({ view, totalCount, favoritesCount, sealedCount, onChange }) {
  const { t, i18n } = useTranslation()
  const number = (value) => formatNumber(i18n.language, value)

  const sealedText = sealedCount > 0 ? t('browser.sealedPacks', { count: sealedCount }) : null
  const collectionSubtitle = t('browser.collectionSubtitle', { number: number(favoritesCount) })
  const isCollection = view === VIEWS.favorites
  const title = isCollection ? t('browser.viewFavoritesName') : t('browser.viewAll')
  // Until the index has loaded the total is unknown: show no number rather than "0"
  const totalKnown = totalCount !== undefined
  const pokedexSubtitle = totalKnown ? t('filters.count', { count: totalCount, number: number(totalCount) }) : ''
  const subtitle = isCollection ? [collectionSubtitle, sealedText].filter(Boolean).join(SUBTITLE_SEPARATOR) : pokedexSubtitle

  const tabs = [
    { view: VIEWS.all, label: t('browser.viewAll'), chip: totalKnown ? number(totalCount) : null },
    {
      view: VIEWS.favorites,
      label: t('browser.viewFavoritesName'),
      chip: number(favoritesCount),
      spokenCount: favoritesCount,
      badge: sealedCount > 0 && <SealedBadge count={sealedCount} spokenText={isCollection ? null : sealedText} />,
    },
  ]

  // The bar is full-bleed (its background spans the viewport); only its tabs and heading keep the page container
  return (
    <>
      <nav className="sticky top-(--header-height) z-10 mt-6 border-b border-slate-300/70 bg-white/70 py-2 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
        <div className={CONTAINER_CLASS}>
          <div role="group" aria-label={t('browser.view')} className="relative mx-auto grid max-w-md grid-cols-2 rounded-2xl bg-white/60 p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.15)] ring-1 ring-slate-300/70 dark:bg-slate-800/60 dark:ring-slate-600">
            <span
              aria-hidden="true"
              className={`absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/2)] rounded-xl bg-brand-600 shadow transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none dark:bg-brand-400 ${INDICATOR_OFFSET[view]}`}
            />
            {tabs.map((tab) => (
              <ViewTab
                key={tab.view}
                view={tab.view}
                label={tab.label}
                chip={tab.chip}
                spokenCount={tab.spokenCount}
                badge={tab.badge}
                isPressed={view === tab.view}
                onSelect={onChange}
              />
            ))}
          </div>
        </div>
      </nav>
      <div className={`${CONTAINER_CLASS} mt-5 mb-4 text-center`}>
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
      </div>
    </>
  )
}
