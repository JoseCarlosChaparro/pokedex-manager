import { BookOpen, Library, Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '../i18n'
import { CONTAINER_CLASS } from '../layout'
import { VIEWS } from '../urlState'

const TAB_ICONS = { [VIEWS.all]: BookOpen, [VIEWS.favorites]: Library }
// The columns share one width (the widest tab), so moving the underline by its own width lands on the second tab
const INDICATOR_OFFSET = { [VIEWS.all]: 'translate-x-0', [VIEWS.favorites]: 'translate-x-full' }
const SUBTITLE_SEPARATOR = ' · '
const TAB_ICON_CLASS = 'hidden size-4.5 shrink-0 sm:block'

// Sits inside the tab, in line with its chip, but hidden from assistive tech: the tab's name stays "Mi colección (3)"
// and the sealed count is spoken by a separate note
function SealedBadge({ count }) {
  return (
    <span
      aria-hidden="true"
      data-sealed-badge
      className="inline-flex h-5 items-center gap-0.5 rounded-full bg-amber-400 px-1.5 text-xs font-bold text-slate-900 tabular-nums motion-safe:animate-pulse"
    >
      <Package className="size-3" />
      {count}
    </span>
  )
}

// The name is the visible label, plus the count in brackets when spokenCount is set ("Mi colección (3)").
// The count sits in sr-only text, not in aria-label: an aria-label would hide the visible chip from the name.
function ViewTab({ view, label, chip, spokenCount, isPressed, onSelect, badge, note }) {
  const Icon = TAB_ICONS[view]
  return (
    <div>
      <button
        type="button"
        aria-pressed={isPressed}
        data-collection-target={view === VIEWS.favorites ? '' : undefined}
        onClick={() => onSelect(view)}
        className="flex min-h-12 w-full items-center justify-center gap-1.5 px-3 text-sm sm:gap-2 sm:px-5 font-semibold whitespace-nowrap text-slate-300 transition-colors hover:text-white aria-pressed:text-white"
      >
        <Icon aria-hidden="true" className={TAB_ICON_CLASS} />
        <span>{label}</span>
        {chip !== null && (
          <span aria-hidden="true" className="min-w-6 rounded-md bg-white/10 px-1.5 text-xs font-medium text-slate-300 tabular-nums">
            {chip}
          </span>
        )}
        {spokenCount !== undefined && (
          <>
            {' '}
            <span className="sr-only">({spokenCount})</span>
          </>
        )}
        {badge}
      </button>
      {note && <span className="sr-only">{note}</span>}
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
  // The Pokédex total already shows in its tab and in the filter count; only the collection adds news (sealed packs).
  // An empty collection says so in its empty state, so "0 en tu colección" would only repeat it.
  const hasCollectionNews = isCollection && favoritesCount > 0
  const subtitle = hasCollectionNews ? [collectionSubtitle, sealedText].filter(Boolean).join(SUBTITLE_SEPARATOR) : null

  const tabs = [
    { view: VIEWS.all, label: t('browser.viewAll'), chip: totalKnown ? number(totalCount) : null },
    {
      view: VIEWS.favorites,
      label: t('browser.viewFavoritesName'),
      chip: number(favoritesCount),
      spokenCount: favoritesCount,
      badge: sealedCount > 0 && <SealedBadge count={sealedCount} />,
      // On the collection view the subtitle already says it
      note: isCollection ? null : sealedText,
    },
  ]

  // The bar continues the header's dark band (full-bleed, sticky right under it); its tabs and heading keep the page container
  return (
    <>
      <nav className="sticky top-(--header-height) z-10 border-b border-white/10 bg-slate-900/90 shadow-md backdrop-blur">
        <div className={CONTAINER_CLASS}>
          <div role="group" aria-label={t('browser.view')} className="relative grid w-full auto-cols-fr grid-flow-col sm:inline-grid sm:w-auto">
            <span
              aria-hidden="true"
              className={`absolute bottom-0 left-0 h-0.75 w-1/2 rounded-t-full bg-brand-400 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${INDICATOR_OFFSET[view]}`}
            />
            {tabs.map((tab) => (
              <ViewTab
                key={tab.view}
                view={tab.view}
                label={tab.label}
                chip={tab.chip}
                spokenCount={tab.spokenCount}
                badge={tab.badge}
                note={tab.note}
                isPressed={view === tab.view}
                onSelect={onChange}
              />
            ))}
          </div>
        </div>
      </nav>
      <div className={`${CONTAINER_CLASS} mt-8 mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1`}>
        <h2 className="text-2xl font-black tracking-tight text-balance sm:text-3xl">{title}</h2>
        {subtitle && <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
      </div>
    </>
  )
}
