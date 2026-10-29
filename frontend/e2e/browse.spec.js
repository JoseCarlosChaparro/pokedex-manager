import { expect, pokemonCards, test } from './fixtures'

test.describe('browsing', () => {
  test.beforeEach(async ({ user, page }) => {
    expect(user.token).toBeTruthy()
    await page.goto('/')
  })

  test('lists 20 Pokémon per page and keeps the page in the URL', async ({ page }) => {
    await expect(pokemonCards(page)).toHaveCount(20)
    await expect(pokemonCards(page).first()).toContainText(/bulbasaur/i)

    await page.getByRole('button', { name: 'Siguiente' }).click()

    await expect(page).toHaveURL(/page=2/)
    await expect(pokemonCards(page).first()).toContainText('#0021')
    await page.goBack()
    await expect(pokemonCards(page).first()).toContainText(/bulbasaur/i)
  })

  test('filters by type', async ({ page }) => {
    await page.getByLabel('Filtrar por tipo').selectOption('fire')

    await expect(page).toHaveURL(/type=fire/)
    await expect(pokemonCards(page).filter({ hasText: /charmander/i })).toBeVisible()
  })

  test('autocompletes a partial name and opens the detail', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Buscar Pokémon' }).fill('pika')
    await page.getByRole('option', { name: /^pikachu #25$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'pikachu' })).toBeVisible()
    await expect(dialog.getByText('Eléctrico')).toBeVisible()
    await expect(page).toHaveURL(/pokemon=25/)
  })

  test('shows a message for an unknown Pokémon', async ({ page }) => {
    const search = page.getByRole('combobox', { name: 'Buscar Pokémon' })
    await search.fill('notapokemon')
    await search.press('Enter')

    await expect(page.getByRole('alert')).toHaveText('No encontramos "notapokemon".')
  })

  test('the detail navigates with the keyboard and closes with Escape, returning focus', async ({ page }) => {
    await page.getByRole('button', { name: '#0004 charmander' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'charmander' })).toBeVisible()

    await page.keyboard.press('ArrowRight')
    await expect(dialog.getByRole('heading', { name: 'charmeleon' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page).not.toHaveURL(/pokemon=/)
    await expect(page.getByRole('button', { name: '#0005 charmeleon' })).toBeFocused()
  })

  test('Back closes the detail', async ({ page }) => {
    await page.getByRole('button', { name: '#0001 bulbasaur' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.goBack()

    await expect(page.getByRole('dialog')).toBeHidden()
  })
})
