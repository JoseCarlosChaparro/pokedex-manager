import { useId, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const FIRST_PAGE = 1
const ICON_SIZE = 18
const ENTER_KEY = 'Enter'
const PAGE_DRAFT_PATTERN = /^\d+$/

const buttonClass =
  'grid min-h-11 min-w-11 place-items-center rounded-xl px-2 text-sm font-medium ring-1 ring-slate-300/70 bg-white/70 backdrop-blur hover:bg-white disabled:opacity-40 dark:bg-slate-800/70 dark:ring-slate-600 dark:hover:bg-slate-700'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export default function Paginator({ page, totalPages, onChange }) {
  const fieldId = useId()
  // null means "not editing": the field shows the current page.
  const [draft, setDraft] = useState(null)
  const { t } = useTranslation()
  if (totalPages <= 1) return null

  function commitDraft() {
    if (draft === null) return
    setDraft(null)
    if (!PAGE_DRAFT_PATTERN.test(draft)) return
    const requested = clamp(Number(draft), FIRST_PAGE, totalPages)
    if (requested !== page) onChange(requested)
  }

  function handleFieldKeyDown(event) {
    if (event.key === ENTER_KEY) commitDraft()
  }

  return (
    <nav aria-label={t('pagination.label')} className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button type="button" aria-label={t('pagination.first')} disabled={page === FIRST_PAGE} onClick={() => onChange(FIRST_PAGE)} className={buttonClass}>
        <ChevronsLeft size={ICON_SIZE} />
      </button>
      <button type="button" aria-label={t('pagination.previous')} disabled={page === FIRST_PAGE} onClick={() => onChange(page - 1)} className={buttonClass}>
        <ChevronLeft size={ICON_SIZE} />
      </button>
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor={fieldId}>
          {t('pagination.page')} <span className="sr-only">{t('pagination.currentOfTotal', { total: totalPages })}</span>
        </label>
        <input
          id={fieldId}
          type="text"
          inputMode="numeric"
          value={draft ?? page}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={handleFieldKeyDown}
          className="min-h-11 w-16 rounded-xl bg-white/70 px-2 text-center ring-1 ring-slate-300/70 dark:bg-slate-800/70 dark:ring-slate-600"
        />
        <span>{t('pagination.ofTotal', { total: totalPages })}</span>
      </div>
      <button type="button" aria-label={t('pagination.next')} disabled={page === totalPages} onClick={() => onChange(page + 1)} className={buttonClass}>
        <ChevronRight size={ICON_SIZE} />
      </button>
      <button type="button" aria-label={t('pagination.last')} disabled={page === totalPages} onClick={() => onChange(totalPages)} className={buttonClass}>
        <ChevronsRight size={ICON_SIZE} />
      </button>
    </nav>
  )
}
