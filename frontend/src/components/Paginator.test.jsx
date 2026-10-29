import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ELLIPSIS, pageItems } from '../pagination'
import Paginator from './Paginator'

describe('pageItems', () => {
  it('lists every page when there are few', () => {
    expect(pageItems(2, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('keeps first, last and neighbours with ellipses in between', () => {
    expect(pageItems(10, 55)).toEqual([1, ELLIPSIS, 9, 10, 11, ELLIPSIS, 55])
    expect(pageItems(1, 55)).toEqual([1, 2, 3, ELLIPSIS, 55])
    expect(pageItems(55, 55)).toEqual([1, ELLIPSIS, 53, 54, 55])
  })
})

describe('Paginator', () => {
  it('marks the current page and jumps to first, last and a typed page', async () => {
    const onChange = vi.fn()
    render(<Paginator page={10} totalPages={55} onChange={onChange} />)

    expect(screen.getByRole('button', { name: 'Página 10' })).toHaveAttribute('aria-current', 'page')

    await userEvent.click(screen.getByRole('button', { name: 'Última página' }))
    expect(onChange).toHaveBeenLastCalledWith(55)

    await userEvent.click(screen.getByRole('button', { name: 'Primera página' }))
    expect(onChange).toHaveBeenLastCalledWith(1)

    await userEvent.type(screen.getByLabelText('Ir a la página'), '42{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(42)
  })

  it('clamps a typed page to the valid range', async () => {
    const onChange = vi.fn()
    render(<Paginator page={1} totalPages={5} onChange={onChange} />)

    await userEvent.type(screen.getByLabelText('Ir a la página'), '99{Enter}')

    expect(onChange).toHaveBeenLastCalledWith(5)
  })
})
