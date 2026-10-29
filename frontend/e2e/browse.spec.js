import { expect, pokemonCards, test } from './fixtures'

const PAGE_SIZE = 24

test.describe('browsing', () => {
  test.beforeEach(async ({ user, page }) => {
    expect(user.token).toBeTruthy()
    await page.goto('/')
    await expect(pokemonCards(page)).toHaveCount(PAGE_SIZE)
  })

  test('paginates by number, jumps to the last page and keeps the page in the URL', async ({ page }) => {
    await expect(pokemonCards(page).first()).toContainText(/bulbasaur/i)

    await page.getByRole('button', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(pokemonCards(page).first()).toContainText('#0025')

    await page.getByRole('button', { name: 'Última página' }).click()
    await expect(page.getByRole('button', { name: 'Última página' })).toBeDisabled()

    await page.getByLabel('Ir a la página').fill('3')
    await page.getByLabel('Ir a la página').press('Enter')
    await expect(page).toHaveURL(/page=3/)
  })

  test('filters while typing, by name or number', async ({ page }) => {
    await page.getByLabel('Buscar Pokémon').fill('pika')

    await expect(page.getByRole('button', { name: /^#0025 pikachu\b/ })).toBeVisible()
    await expect(page.getByText(/^\d+ Pokémon$/)).toBeVisible()
    await expect(page).toHaveURL(/q=pika/)

    await page.getByLabel('Buscar Pokémon').fill('#6')
    await expect(page.getByRole('button', { name: /^#0006 charizard\b/ })).toBeVisible()
  })

  test('combines type chips and generation', async ({ page }) => {
    await page.getByRole('group', { name: 'Filtrar por tipo' }).getByRole('button', { name: 'Fuego' }).click()
    await page.getByRole('group', { name: 'Filtrar por tipo' }).getByRole('button', { name: 'Volador' }).click()
    await page.getByLabel('Generación').selectOption('1')

    await expect(page).toHaveURL(/types=fire%2Cflying|types=fire,flying/)
    await expect(pokemonCards(page)).toHaveCount(2)
    await expect(page.getByRole('button', { name: /^#0006 charizard\b/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^#0146 moltres\b/ })).toBeVisible()

    await page.getByRole('button', { name: 'Limpiar filtros' }).click()
    await expect(pokemonCards(page)).toHaveCount(PAGE_SIZE)
  })

  test('changes card size', async ({ page }) => {
    await page.getByRole('button', { name: 'Tarjetas: Grande' }).click()

    await expect(page).toHaveURL(/density=large/)
    await expect(page.getByRole('button', { name: 'Tarjetas: Grande' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('the detail navigates with the keyboard and closes with Escape, returning focus', async ({ page }) => {
    await page.getByRole('button', { name: /^#0004 charmander\b/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'charmander' })).toBeVisible()

    await page.keyboard.press('ArrowRight')
    await expect(dialog.getByRole('heading', { name: 'charmeleon' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page).not.toHaveURL(/pokemon=/)
    await expect(page.getByRole('button', { name: /^#0005 charmeleon\b/ })).toBeFocused()
  })

  test('Back closes the detail', async ({ page }) => {
    await page.getByRole('button', { name: /^#0001 bulbasaur\b/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.goBack()

    await expect(page.getByRole('dialog')).toBeHidden()
  })
})
