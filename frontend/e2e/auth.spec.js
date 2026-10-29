import { PASSWORD, expect, test, uniqueEmail } from './fixtures'

test('a new user registers, logs out and logs back in', async ({ page }) => {
  const email = uniqueEmail('register')
  await page.goto('/')

  await page.getByRole('button', { name: /regístrate/i }).click()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(PASSWORD)
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page.getByRole('heading', { name: /PokéDex/ })).toBeVisible()

  await page.getByRole('button', { name: /Cerrar sesión|Salir/ }).click()
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByLabel('Buscar Pokémon')).toBeVisible()
})

test('a wrong password shows a friendly error', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Email').fill(uniqueEmail('nobody'))
  await page.getByLabel('Contraseña').fill('WrongPassword')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByRole('alert')).toHaveText('Email o contraseña incorrectos')
})
