import { PackageOpen, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Each variant picks its icon and copy keys; one layout renders them all
const VARIANTS = {
  collection: {
    Icon: PackageOpen,
    titleKey: 'emptyState.collectionTitle',
    hintKey: 'emptyState.collectionHint',
    actionKey: 'emptyState.collectionAction',
  },
  noResults: {
    Icon: SearchX,
    titleKey: 'emptyState.noResultsTitle',
    hintKey: 'emptyState.noResultsHint',
    actionKey: 'emptyState.noResultsAction',
  },
}

// Decorative outlined Poké Ball; the float animation lives in index.css and stops under reduced motion
function PokeBallOutline() {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className="empty-state__ball size-24">
      <circle cx="50" cy="50" r="44" strokeWidth="6" className="fill-white stroke-slate-800 dark:fill-slate-900 dark:stroke-slate-300" />
      <path d="M6 50A44 44 0 0 1 94 50Z" className="fill-brand-600 dark:fill-brand-400" />
      <path d="M6 50H94" strokeWidth="6" className="stroke-slate-800 dark:stroke-slate-300" />
      <circle cx="50" cy="50" r="12" strokeWidth="6" className="fill-white stroke-slate-800 dark:fill-slate-900 dark:stroke-slate-300" />
    </svg>
  )
}

export default function EmptyState({ variant, onAction }) {
  const { t } = useTranslation()
  const { Icon, titleKey, hintKey, actionKey } = VARIANTS[variant]

  return (
    <div className="mx-auto mt-4 flex max-w-md flex-col items-center gap-3 rounded-3xl bg-white/70 px-6 py-10 text-center shadow-lg ring-1 ring-slate-200/80 backdrop-blur dark:bg-slate-800/70 dark:ring-slate-700">
      <div className="relative grid size-40 place-items-center">
        <span aria-hidden="true" className="empty-state__aura absolute inset-0 rounded-full" />
        <PokeBallOutline />
        <span className="absolute right-0 bottom-0 grid size-11 place-items-center rounded-full bg-slate-900 text-white ring-4 ring-white dark:bg-slate-100 dark:text-slate-900 dark:ring-slate-800">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <h3 className="text-xl font-bold">{t(titleKey)}</h3>
      <p className="text-slate-600 dark:text-slate-400">{t(hintKey)}</p>
      <button
        type="button"
        onClick={onAction}
        className="min-h-11 rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700 dark:bg-brand-400 dark:text-slate-950 dark:hover:bg-brand-500"
      >
        {t(actionKey)}
      </button>
    </div>
  )
}
