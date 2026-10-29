import { test as base, expect } from '@playwright/test'

export const API_URL = 'http://localhost:8000'
export const PASSWORD = 'E2ePassword123'
const TOKEN_KEY = 'pokedex_token'

export const uniqueEmail = (prefix = 'e2e') => `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`

// `user`: a fresh account per test, already logged in (token injected before the app loads)
export const test = base.extend({
  user: async ({ page, request }, use) => {
    const email = uniqueEmail()
    await request.post(`${API_URL}/auth/register`, { data: { email, password: PASSWORD } })
    const login = await request.post(`${API_URL}/auth/login`, { data: { email, password: PASSWORD } })
    const { access_token: token } = await login.json()
    await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [TOKEN_KEY, token])
    await use({ email, token })
  },
})

export { expect }

export const pokemonCards = (page) => page.locator('[data-pokemon-id]')

// The filter panel starts collapsed below md; open it only when the toggle is shown
export async function openFilters(page) {
  const toggle = page.getByRole('button', { name: /^Filtros/ })
  if ((await toggle.isVisible()) && (await toggle.getAttribute('aria-expanded')) === 'false') {
    await toggle.click()
  }
}
