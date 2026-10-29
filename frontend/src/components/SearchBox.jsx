import { useEffect, useId, useRef, useState } from 'react'
import { spriteUrl } from '../sprites'

const SUGGESTION_DELAY_MS = 200
const NO_ACTIVE_OPTION = -1


function isTypingTarget(element) {
  return element instanceof HTMLElement && (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName))
}

// ARIA combobox (https://www.w3.org/WAI/ARIA/apg/patterns/combobox/): ↑/↓ move, Enter picks, Escape closes.
export default function SearchBox({ initialValue = '', fetchSuggestions, onSubmit, onSelect }) {
  const [term, setTerm] = useState(initialValue)
  const [suggestions, setSuggestions] = useState([])
  const [activeIndex, setActiveIndex] = useState(NO_ACTIVE_OPTION)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef(null)
  const listboxId = useId()

  useEffect(() => {
    const query = term.trim()
    if (!query) return undefined
    let isStale = false
    const timer = setTimeout(() => {
      fetchSuggestions(query)
        .then((results) => {
          if (isStale) return
          setSuggestions(results)
          setActiveIndex(NO_ACTIVE_OPTION)
        })
        .catch(() => {
          if (!isStale) setSuggestions([])
        })
    }, SUGGESTION_DELAY_MS)
    return () => {
      isStale = true
      clearTimeout(timer)
    }
  }, [term, fetchSuggestions])

  useEffect(() => {
    function handleShortcut(event) {
      if (event.key !== '/' || isTypingTarget(document.activeElement)) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  function handleChange(event) {
    setTerm(event.target.value)
    setIsOpen(true)
    if (!event.target.value.trim()) setSuggestions([])
  }

  function close() {
    setIsOpen(false)
    setActiveIndex(NO_ACTIVE_OPTION)
  }

  function choose(suggestion) {
    close()
    setTerm(suggestion.name)
    onSelect(suggestion)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' && suggestions.length) {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((index) => (index + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp' && suggestions.length) {
      event.preventDefault()
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1))
    } else if (event.key === 'Escape') {
      close()
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (isOpen && activeIndex !== NO_ACTIVE_OPTION) return choose(suggestions[activeIndex])
    const query = term.trim()
    if (!query) return
    close()
    onSubmit(query)
  }

  const showSuggestions = isOpen && term.trim() !== '' && suggestions.length > 0
  const optionId = (index) => `${listboxId}-option-${index}`

  return (
    <form role="search" onSubmit={handleSubmit} className="relative flex flex-1 gap-2">
      <div className="relative min-w-0 flex-1">
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          value={term}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={close}
          placeholder="Buscar por nombre o número"
          aria-label="Buscar Pokémon"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={listboxId}
          aria-activedescendant={showSuggestions && activeIndex !== NO_ACTIVE_OPTION ? optionId(activeIndex) : undefined}
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 dark:border-slate-600 dark:bg-slate-800"
        />
        <kbd aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border border-slate-300 px-1.5 text-xs text-slate-400 sm:block dark:border-slate-600">
          /
        </kbd>
        {showSuggestions && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Sugerencias"
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                id={optionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                // mousedown instead of click: runs before the input's blur closes the list
                onMouseDown={(event) => {
                  event.preventDefault()
                  choose(suggestion)
                }}
                className="flex min-h-11 cursor-pointer items-center gap-2 px-3 capitalize aria-selected:bg-red-100 dark:aria-selected:bg-red-900/40"
              >
                <img src={spriteUrl(suggestion.id)} alt="" className="h-10 w-10" loading="lazy" />
                <span className="flex-1">{suggestion.name.replaceAll('-', ' ')}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">#{suggestion.id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button className="min-h-11 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700">Buscar</button>
    </form>
  )
}
