import { expect, pokemonCards, test } from './fixtures'

test.describe('my collection', () => {
  test.beforeEach(async ({ user, page }) => {
    expect(user.email).toContain('@')
    await page.goto('/')
    await expect(pokemonCards(page).first()).toBeVisible()
  })

  test('a new favorite arrives as a sealed pack that opens with the button', async ({ page }) => {
    await page.getByRole('button', { name: 'Agregar a bulbasaur a mi colección' }).click()
    await page.getByRole('button', { name: 'Mi colección (1)' }).click()

    await expect(page.getByRole('button', { name: 'Abrir sobre 1' })).toBeVisible()
    await page.getByRole('button', { name: 'Abrir sobre 1' }).click()
    await expect(page.getByRole('button', { name: /^#0001 bulbasaur\b/ })).toBeVisible()

    // Opening is remembered
    await page.reload()
    await expect(page.getByRole('button', { name: /^#0001 bulbasaur\b/ })).toBeVisible()

    await page.getByRole('button', { name: 'Quitar a bulbasaur de mi colección' }).click()
    await expect(page.getByText('Tu colección está vacía')).toBeVisible()
  })

  test('a pack tears open by dragging its strip', async ({ page, isMobile }) => {
    test.skip(isMobile, 'drag gesture checked with a mouse on desktop')
    await page.getByRole('button', { name: 'Agregar a ivysaur a mi colección' }).click()
    await page.getByRole('button', { name: 'Mi colección (1)' }).click()

    const strip = page.locator('.booster__strip')
    const box = await strip.boundingBox()
    await page.mouse.move(box.x + 10, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width, box.y + box.height / 2, { steps: 8 })
    await page.mouse.up()

    await expect(page.getByRole('button', { name: /^#0002 ivysaur\b/ })).toBeVisible()
  })
})
