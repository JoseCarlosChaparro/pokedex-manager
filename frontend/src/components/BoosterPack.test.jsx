import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BoosterPack from './BoosterPack'

const PIKACHU = { id: 25, name: 'pikachu', types: ['electric'] }

describe('BoosterPack', () => {
  afterEach(() => vi.useRealTimers())

  it('hides the Pokémon until the pack is opened with the button', async () => {
    const onOpen = vi.fn()
    render(<BoosterPack pokemon={PIKACHU} onOpen={onOpen} />)
    expect(screen.getByText('pikachu').closest('.booster__reveal')).toHaveAttribute('aria-hidden', 'true')

    await userEvent.click(screen.getByRole('button', { name: 'Abrir sobre de pikachu' }))

    await vi.waitFor(() => expect(onOpen).toHaveBeenCalledWith(PIKACHU))
    expect(screen.getByRole('button', { name: /abrir sobre/i })).toBeDisabled()
  })

  it('opens only once', async () => {
    vi.useFakeTimers()
    const onOpen = vi.fn()
    render(<BoosterPack pokemon={PIKACHU} onOpen={onOpen} />)
    const button = screen.getByRole('button', { name: /abrir sobre/i })

    act(() => {
      button.click()
      button.click()
      vi.runAllTimers()
    })

    expect(onOpen).toHaveBeenCalledTimes(1)
  })
})
