import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ChunkErrorBoundary from './ChunkErrorBoundary'

function ThrowingChild() {
  throw new Error('chunk failed to load')
}

describe('ChunkErrorBoundary', () => {
  // React logs every caught render error; the test expects it, so the log is silenced and restored
  afterEach(() => vi.restoreAllMocks())

  it('renders a retry button in place of a child that throws, and calls onRetry when it is pressed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onRetry = vi.fn()
    render(
      <ChunkErrorBoundary onRetry={onRetry}>
        <ThrowingChild />
      </ChunkErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar esta parte de la app.')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders its children when nothing throws', () => {
    render(
      <ChunkErrorBoundary onRetry={vi.fn()}>
        <p>grid</p>
      </ChunkErrorBoundary>,
    )

    expect(screen.getByText('grid')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
