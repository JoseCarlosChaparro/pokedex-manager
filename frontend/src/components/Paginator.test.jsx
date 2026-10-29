import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Paginator from './Paginator'

async function replaceFieldText(field, text) {
  await userEvent.clear(field)
  await userEvent.type(field, text)
}

describe('Paginator', () => {
  it('shows the current page in a single field with the total', () => {
    render(<Paginator page={3} totalPages={57} onChange={vi.fn()} />)

    expect(screen.getByRole('textbox', { name: /Página/ })).toHaveValue('3')
    expect(screen.getByText('de 57')).toBeVisible()
    expect(screen.queryByRole('button', { name: /^Página \d+$/ })).not.toBeInTheDocument()
  })

  it('jumps with first, previous, next and last, disabling the ends', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<Paginator page={10} totalPages={55} onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Primera página' }))
    expect(onChange).toHaveBeenLastCalledWith(1)
    await userEvent.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(onChange).toHaveBeenLastCalledWith(9)
    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(onChange).toHaveBeenLastCalledWith(11)
    await userEvent.click(screen.getByRole('button', { name: 'Última página' }))
    expect(onChange).toHaveBeenLastCalledWith(55)

    rerender(<Paginator page={1} totalPages={55} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Primera página' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()

    rerender(<Paginator page={55} totalPages={55} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Última página' })).toBeDisabled()
  })

  it('applies a typed page on Enter and on blur, clamped', async () => {
    const onChange = vi.fn()
    render(<Paginator page={10} totalPages={55} onChange={onChange} />)
    const field = screen.getByRole('textbox', { name: /Página/ })

    await replaceFieldText(field, '42{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(42)

    await replaceFieldText(field, '99')
    await userEvent.tab()
    expect(onChange).toHaveBeenLastCalledWith(55)

    await replaceFieldText(field, '0{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(1)
  })

  it('restores the current page for non-numbers and does not re-emit the current page', async () => {
    const onChange = vi.fn()
    render(<Paginator page={10} totalPages={55} onChange={onChange} />)
    const field = screen.getByRole('textbox', { name: /Página/ })

    await replaceFieldText(field, 'abc{Enter}')
    expect(onChange).not.toHaveBeenCalled()
    expect(field).toHaveValue('10')

    await replaceFieldText(field, '10{Enter}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders nothing with a single page', () => {
    const { container } = render(<Paginator page={1} totalPages={1} onChange={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })
})
