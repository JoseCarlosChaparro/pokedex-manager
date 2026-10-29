import AxeBuilder from '@axe-core/playwright'
import { expect, test } from './fixtures'

const WCAG_22_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function expectNoViolations(page) {
  // Entrance animations fade content in; measure contrast on the final state (the background loops forever)
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .filter((animation) => animation.effect?.getTiming().iterations !== Number.POSITIVE_INFINITY)
      .every((animation) => animation.playState !== 'running'),
  )
  // The holo foil is decorative and animated; axe can't compute contrast through blend modes reliably
  const results = await new AxeBuilder({ page }).withTags(WCAG_22_AA).exclude('.holo-art').analyze()
  expect(results.violations.map(({ id, nodes }) => `${id}: ${nodes.map((n) => n.target).join(', ')}`)).toEqual([])
}

for (const colorScheme of ['light', 'dark']) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme })

    test('login page has no WCAG 2.2 AA violations', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
      await expectNoViolations(page)
    })

    test('list and detail have no WCAG 2.2 AA violations', async ({ user, page }) => {
      expect(user.token).toBeTruthy()
      await page.goto('/')
      await expect(page.locator('[data-pokemon-id]')).toHaveCount(24)
      await expectNoViolations(page)

      await page.goto('/?pokemon=6')
      await expect(page.getByRole('dialog').getByRole('heading', { name: 'charizard' })).toBeVisible()
      await expectNoViolations(page)
    })
  })
}

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the holo card does not tilt or animate', async ({ user, page }) => {
    expect(user.token).toBeTruthy()
    await page.goto('/?pokemon=25')
    const card = page.locator('.holo-card')
    await card.hover({ position: { x: 10, y: 10 } })

    await expect(card).toHaveCSS('transform', 'none')
    await expect(card).toHaveCSS('animation-name', 'none')
  })
})
