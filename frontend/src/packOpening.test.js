import { afterEach, describe, expect, it, vi } from 'vitest'
import { centeredRect, vibratePack } from './packOpening'

describe('centeredRect', () => {
  it('fits a portrait stage by width and centers the pack', () => {
    const rect = centeredRect({ left: 0, top: 0, width: 400, height: 900 })

    expect(rect.width).toBeCloseTo(288)
    expect(rect.height).toBeCloseTo(403.2)
    expect(rect.left).toBeCloseTo(56)
    expect(rect.top).toBeCloseTo(248.4)
  })

  it('fits a landscape phone by height', () => {
    const rect = centeredRect({ left: 0, top: 0, width: 1000, height: 300 })

    expect(rect.height).toBeCloseTo(210)
    expect(rect.width).toBeCloseTo(150)
  })

  it('caps the pack size on large displays', () => {
    expect(centeredRect({ left: 0, top: 0, width: 2560, height: 1440 }).width).toBeCloseTo(352)
  })
})

describe('vibratePack', () => {
  afterEach(() => {
    delete navigator.vibrate
  })

  it('buzzes when the device supports vibration', () => {
    const vibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })

    vibratePack()

    expect(vibrate).toHaveBeenCalledTimes(1)
  })

  it('does nothing when the device has no vibration support', () => {
    expect(navigator.vibrate).toBeUndefined()
    expect(() => vibratePack()).not.toThrow()
  })
})
