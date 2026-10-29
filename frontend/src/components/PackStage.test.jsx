import { render } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import PackStage from './PackStage'

const PIKACHU = { id: 25, name: 'pikachu', types: ['electric'] }

// The stage lives in <body> through a portal, so the test reads it back through its ref
function renderStage(isOpening) {
  const stageRef = createRef()
  render(<PackStage stageRef={stageRef} cardRef={createRef()} pokemon={PIKACHU} density="comfy" isOpening={isOpening} />)
  return stageRef.current
}

describe('PackStage pointer events', () => {
  it('blocks clicks on the gallery while the opening runs, and stays hidden from assistive tech', () => {
    const stage = renderStage(true)

    expect(stage).toHaveClass('pointer-events-auto')
    expect(stage).not.toHaveClass('pointer-events-none')
    expect(stage).toHaveAttribute('aria-hidden', 'true')
  })

  it('lets clicks through when no opening runs', () => {
    expect(renderStage(false)).toHaveClass('pointer-events-none')
  })
})
