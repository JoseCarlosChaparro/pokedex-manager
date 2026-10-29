import { defineConfig, devices } from '@playwright/test'

// Full-stack e2e: needs MongoDB on localhost:27017 (`docker compose up -d mongo` from the repo root).
// The API talks to the real PokéAPI.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'uv run fastapi run src/pokedex_manager/__init__.py --port 8000',
      cwd: '..',
      url: 'http://localhost:8000/docs',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
})
