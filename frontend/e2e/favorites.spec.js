import { expect, pokemonCards, test } from './fixtures'

test('adds and removes a Pokémon from my collection', async ({ user, page }) => {
  expect(user.email).toContain('@')
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar a bulbasaur a mi colección' }).click()
  await expect(page.getByRole('button', { name: 'Mi colección (1)' })).toBeVisible()

  await page.getByRole('button', { name: 'Mi colección (1)' }).click()
  await expect(pokemonCards(page)).toHaveCount(1)
  await expect(pokemonCards(page)).toContainText(/bulbasaur/i)

  await page.reload()
  await expect(pokemonCards(page)).toHaveCount(1)

  await page.getByRole('button', { name: 'Quitar a bulbasaur de mi colección' }).click()
  await expect(page.getByText('Tu colección está vacía')).toBeVisible()
})
