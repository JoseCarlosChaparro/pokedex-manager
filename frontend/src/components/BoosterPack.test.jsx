import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BoosterPack from './BoosterPack'

const PIKACHU = { id: 25, name: 'pikachu', types: ['electric'] }

describe('BoosterPack', () => {
  afterEach(() => vi.useRealTimers())

  it('hides the Pokémon until the pack is opened with the button', async () => {
    const onOpen = vi.fn()
    render(<BoosterPack pokemon={PIKACHU} position={1} onOpen={onOpen} />)
    expect(screen.getByText('pikachu').closest('.booster__reveal')).toHaveAttribute('aria-hidden', 'true')

    await userEvent.click(screen.getByRole('button', { name: 'Abrir sobre 1' }))

    await vi.waitFor(() => expect(onOpen).toHaveBeenCalledWith(PIKACHU))
    expect(screen.getByRole('button', { name: /abrir sobre/i })).toBeDisabled()
  })

  it('does not reveal the Pokémon in the button name', () => {
    render(<BoosterPack pokemon={PIKACHU} position={1} onOpen={vi.fn()} />)

    expect(screen.getByRole('button', { name: /abrir sobre/i })).not.toHaveAccessibleName(/pikachu/i)
  })

  it('opens only once', async () => {
    vi.useFakeTimers()
    const onOpen = vi.fn()
    render(<BoosterPack pokemon={PIKACHU} position={1} onOpen={onOpen} />)
    const button = screen.getByRole('button', { name: /abrir sobre/i })

    act(() => {
      button.click()
      button.click()
      vi.runAllTimers()
    })

    expect(onOpen).toHaveBeenCalledTimes(1)
  })
})
