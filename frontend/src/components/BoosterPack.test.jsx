import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import BoosterPack from './BoosterPack'

const PIKACHU = { id: 25, name: 'pikachu', types: ['electric'] }
const OPEN_BUTTON = /abrir sobre/i

// The opening is injected so the real GSAP timeline never runs in jsdom
function renderPack({ playOpening = vi.fn(() => Promise.resolve()), onOpen = vi.fn() } = {}) {
  const view = render(<BoosterPack pokemon={PIKACHU} position={1} onOpen={onOpen} playOpening={playOpening} />)
  return { ...view, onOpen, playOpening }
}

// Drags the strip from x=100 to releaseX across a 100px-wide pack, then releases
function dragStripTo(container, releaseX) {
  const pack = container.querySelector('.booster')
  const strip = container.querySelector('.booster__strip')
  vi.spyOn(pack, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 100 })
  strip.setPointerCapture = vi.fn()
  fireEvent.pointerDown(strip, { clientX: 100, pointerId: 1 })
  fireEvent.pointerMove(strip, { clientX: releaseX, pointerId: 1 })
  fireEvent.pointerUp(strip, { clientX: releaseX, pointerId: 1 })
  return pack
}

describe('BoosterPack', () => {
  it('hides the Pokémon until the pack is opened with the button', async () => {
    const { onOpen } = renderPack()
    expect(screen.getByText('pikachu').closest('.booster__reveal')).toHaveAttribute('aria-hidden', 'true')

    await userEvent.click(screen.getByRole('button', { name: 'Abrir sobre 1' }))

    await vi.waitFor(() => expect(onOpen).toHaveBeenCalledWith(PIKACHU))
    expect(screen.getByRole('button', OPEN_BUTTON)).toBeDisabled()
  })

  it('does not reveal the Pokémon in the button name', () => {
    renderPack()

    expect(screen.getByRole('button', OPEN_BUTTON)).not.toHaveAccessibleName(/pikachu/i)
  })

  it('plays the opening and then opens the pack once', async () => {
    const { onOpen, playOpening } = renderPack()
    const button = screen.getByRole('button', OPEN_BUTTON)

    act(() => {
      button.click()
      button.click()
    })

    await vi.waitFor(() => expect(onOpen).toHaveBeenCalledWith(PIKACHU))
    expect(playOpening).toHaveBeenCalledTimes(1)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('does not open the pack after it unmounts mid-opening', async () => {
    let finishOpening
    const playOpening = vi.fn(() => new Promise((resolve) => (finishOpening = resolve)))
    const { onOpen, unmount } = renderPack({ playOpening })
    await userEvent.click(screen.getByRole('button', OPEN_BUTTON))

    unmount()
    await act(async () => finishOpening())

    expect(onOpen).not.toHaveBeenCalled()
  })

  it('passes the pack, slot, stage and reveal elements to the opening', async () => {
    const { container, playOpening } = renderPack()
    await userEvent.click(screen.getByRole('button', OPEN_BUTTON))

    const pack = container.querySelector('.booster')
    expect(playOpening).toHaveBeenCalledWith(
      expect.objectContaining({
        pack,
        slot: pack.parentElement,
        card: container.querySelector('.booster__reveal'),
        stage: expect.any(HTMLElement),
      }),
    )
  })

  it('passes reducedMotion from the user preference', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    const { playOpening } = renderPack()

    await userEvent.click(screen.getByRole('button', OPEN_BUTTON))

    expect(playOpening).toHaveBeenCalledWith(expect.objectContaining({ reducedMotion: true }))
  })

  it('resets the tilt when the opening starts and ignores later tilt moves', async () => {
    const { container } = renderPack()
    const pack = container.querySelector('.booster')
    pack.style.setProperty('--rx', '3deg')

    await userEvent.click(screen.getByRole('button', OPEN_BUTTON))
    fireEvent.pointerMove(pack, { clientX: 10, clientY: 10, pointerType: 'mouse' })

    expect(pack.style.getPropertyValue('--rx')).toBe('0deg')
  })

  it('tears toward the drag direction', () => {
    const tearOnDrag = (releaseX) => dragStripTo(renderPack().container, releaseX)

    expect(tearOnDrag(10).style.getPropertyValue('--tear-dir')).toBe('-1')
    expect(tearOnDrag(190).style.getPropertyValue('--tear-dir')).toBe('1')
  })

  it('a drag past the threshold plays the opening and opens the pack once', async () => {
    const { container, onOpen, playOpening } = renderPack()

    dragStripTo(container, 190)

    await vi.waitFor(() => expect(onOpen).toHaveBeenCalledWith(PIKACHU))
    expect(playOpening).toHaveBeenCalledTimes(1)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })
})
