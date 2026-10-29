import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SearchBox from './SearchBox'

const SUGGESTIONS = [
  { id: 25, name: 'pikachu' },
  { id: 172, name: 'pichu' },
]

function renderSearchBox(props = {}) {
  const handlers = {
    fetchSuggestions: vi.fn().mockResolvedValue(SUGGESTIONS),
    onSubmit: vi.fn(),
    onSelect: vi.fn(),
  }
  render(<SearchBox {...handlers} {...props} />)
  return handlers
}

describe('SearchBox', () => {
  it('shows suggestions while typing', async () => {
    const { fetchSuggestions } = renderSearchBox()

    await userEvent.type(screen.getByRole('combobox'), 'pi')

    expect(await screen.findByRole('option', { name: /pikachu/i })).toBeInTheDocument()
    expect(fetchSuggestions).toHaveBeenLastCalledWith('pi')
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true')
  })

  it('selects a suggestion with the keyboard', async () => {
    const { onSelect } = renderSearchBox()
    const input = screen.getByRole('combobox')
    await userEvent.type(input, 'pi')
    await screen.findByRole('option', { name: /pikachu/i })

    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')

    expect(onSelect).toHaveBeenCalledWith(SUGGESTIONS[1])
  })

  it('submits the typed text when no suggestion is active', async () => {
    const { onSubmit, onSelect } = renderSearchBox()

    await userEvent.type(screen.getByRole('combobox'), 'mew{Enter}')

    expect(onSubmit).toHaveBeenCalledWith('mew')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('closes the suggestions with Escape', async () => {
    renderSearchBox()
    await userEvent.type(screen.getByRole('combobox'), 'pi')
    await screen.findByRole('listbox')

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('focuses the search box with the / shortcut', async () => {
    renderSearchBox()

    await userEvent.keyboard('/')

    expect(screen.getByRole('combobox')).toHaveFocus()
    expect(screen.getByRole('combobox')).toHaveValue('')
  })
})
