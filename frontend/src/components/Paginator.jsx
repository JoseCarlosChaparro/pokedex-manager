import { useState } from 'react'
import { ELLIPSIS, pageItems } from '../pagination'

const buttonClass =
  'grid min-h-11 min-w-11 place-items-center rounded-xl px-2 text-sm font-medium ring-1 ring-slate-300/70 bg-white/70 backdrop-blur hover:bg-white disabled:opacity-40 dark:bg-slate-800/70 dark:ring-slate-600 dark:hover:bg-slate-700'

export default function Paginator({ page, totalPages, onChange }) {
  const [target, setTarget] = useState('')
  if (totalPages <= 1) return null

  function handleJump(event) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const requested = Number.parseInt(target, 10)
    if (!Number.isInteger(requested)) return
    onChange(Math.min(Math.max(1, requested), totalPages))
    setTarget('')
  }

  return (
    <nav aria-label="Paginación" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button type="button" aria-label="Primera página" disabled={page === 1} onClick={() => onChange(1)} className={buttonClass}>
        «
      </button>
      <button type="button" aria-label="Página anterior" disabled={page === 1} onClick={() => onChange(page - 1)} className={buttonClass}>
        ‹
      </button>
      <ol className="flex flex-wrap items-center gap-1">
        {pageItems(page, totalPages).map((item, index) =>
          item === ELLIPSIS ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-slate-500">
              {ELLIPSIS}
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onChange(item)}
                className={`${buttonClass} aria-[current=page]:bg-red-600 aria-[current=page]:text-white aria-[current=page]:ring-red-600`}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ol>
      <button type="button" aria-label="Página siguiente" disabled={page === totalPages} onClick={() => onChange(page + 1)} className={buttonClass}>
        ›
      </button>
      <button type="button" aria-label="Última página" disabled={page === totalPages} onClick={() => onChange(totalPages)} className={buttonClass}>
        »
      </button>
      <div className="flex items-center gap-1">
        <label htmlFor="page-jump" className="sr-only">
          Ir a la página
        </label>
        <input
          id="page-jump"
          type="number"
          inputMode="numeric"
          min="1"
          max={totalPages}
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          onKeyDown={handleJump}
          placeholder="Ir a…"
          className="min-h-11 w-20 rounded-xl bg-white/70 px-2 text-sm ring-1 ring-slate-300/70 dark:bg-slate-800/70 dark:ring-slate-600"
        />
      </div>
    </nav>
  )
}
