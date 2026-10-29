// Visual audit capture script (not a test). Run from frontend/: node scripts/visual-audit.mjs
// Optional comma-separated filters: --widths=300,1280  --themes=light  --screens=grid,pack
// Screens: login, grid, focus, noresults, detail, collection, pack, empty
// Partial runs merge into the existing metrics.json, so the other shots keep their numbers.
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const WEB = 'http://localhost:5173'
const API = 'http://localhost:8000'
const PASSWORD = 'E2ePassword123'
const OUT = new URL('../visual-audit/', import.meta.url).pathname
const METRICS_PATH = `${OUT}metrics.json`
const SIZES = [[300, 650], [768, 1024], [1280, 800], [2560, 1440]]
const THEMES = ['light', 'dark']
const SCREENS = ['login', 'grid', 'focus', 'noresults', 'detail', 'collection', 'pack', 'empty']
const REDUCED_WIDTH = 300
const MIN_TARGET = 24
// The real Spanish name of the detail's prev/next group (the buttons themselves are only "#0025" style text)
const DETAIL_NAV_NAME = JSON.parse(readFileSync(new URL('../src/i18n/locales/es.json', import.meta.url), 'utf8')).detail.navLabel

// "--name=a,b" -> ['a', 'b']; no flag -> everything. Unknown names fail loudly instead of capturing nothing.
function selectFrom(name, all) {
  const arg = process.argv.find((value) => value.startsWith(`--${name}=`))
  if (!arg) return all
  const picked = arg.slice(name.length + 3).split(',')
  const unknown = picked.filter((value) => !all.map(String).includes(value))
  if (unknown.length) throw new Error(`Unknown --${name}: ${unknown.join(', ')}`)
  return all.filter((value) => picked.includes(String(value)))
}

const widths = selectFrom('widths', SIZES.map(([w]) => w))
const themes = selectFrom('themes', THEMES)
const screens = selectFrom('screens', SCREENS)
const sizes = SIZES.filter(([w]) => widths.includes(w))
const metrics = existsSync(METRICS_PATH) ? JSON.parse(readFileSync(METRICS_PATH, 'utf8')) : { shots: {}, axe: {} }
mkdirSync(OUT, { recursive: true })

async function post(path, data, token) {
  const res = await fetch(API + path, { method: 'POST', headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) }, body: JSON.stringify(data) })
  return res.json().catch(() => ({}))
}
async function makeUser(prefix, favs = []) {
  const email = `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@example.com`
  await post('/auth/register', { email, password: PASSWORD })
  const { access_token: token } = await post('/auth/login', { email, password: PASSWORD })
  for (const id of favs) await fetch(`${API}/api/me/favorites/${id}`, { method: 'PUT', headers: { authorization: `Bearer ${token}` } })
  return token
}

async function measure(page) {
  return page.evaluate((min) => {
    const name = (el) => (el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || el.getAttribute('placeholder') || el.tagName).trim().slice(0, 50)
    const small = []
    for (const el of document.querySelectorAll('a[href],button,input,select,textarea,[role=button],[role=tab],[tabindex]:not([tabindex="-1"])')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue
      if (getComputedStyle(el).visibility === 'hidden') continue
      if (r.width < min || r.height < min) small.push(`${name(el)} ${Math.round(r.width)}x${Math.round(r.height)}`)
    }
    return { scrollWidth: document.documentElement.scrollWidth, innerWidth, overflow: document.documentElement.scrollWidth > innerWidth, small }
  }, MIN_TARGET)
}

async function shot(page, key) {
  await page.screenshot({ path: `${OUT}${key}.png` })
  metrics.shots[key] = await measure(page)
}

async function axeViolations(page) {
  return (await new AxeBuilder({ page }).analyze()).violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target }))
}

async function newPage(browser, w, h, theme, token, reduced) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  const page = await ctx.newPage()
  await page.addInitScript(([t, tok]) => {
    localStorage.setItem('pokedex_theme', t)
    if (tok) localStorage.setItem('pokedex_token', tok)
  }, [theme, token])
  return page
}

async function expandFilters(page) {
  const toggle = page.getByRole('button', { name: /^Filtros/ })
  if ((await toggle.count()) && (await toggle.isVisible()) && (await toggle.getAttribute('aria-expanded')) === 'false') {
    await toggle.click()
    await page.waitForTimeout(400)
  }
}
const settle = (page) => page.waitForTimeout(700)
const guard = async (key, fn) => { try { await fn() } catch (e) { metrics.shots[key] = { error: String(e).split('\n')[0] } } }

async function openGrid(page) {
  await page.goto(WEB); await page.locator('[data-pokemon-id]').first().waitFor(); await settle(page)
}
async function openCollection(page) {
  await openGrid(page)
  await page.getByRole('button', { name: /Mi colección/ }).first().click()
}

async function runConfig(browser, [w, h], theme, reduced) {
  const wants = (screen) => screens.includes(screen)
  // fresh users per config: opening a pack is persisted server-side
  const tokens = { fav: await makeUser('audit', [1, 4, 25]), empty: await makeUser('audit-empty') }
  const tag = `${w}-${theme}${reduced ? '-reduced' : ''}`
  const page = await newPage(browser, w, h, theme, tokens.fav, reduced)

  if (wants('login')) await guard(`${tag}-login`, async () => {
    const loginPage = await newPage(browser, w, h, theme, null, reduced)
    await loginPage.goto(WEB); await settle(loginPage)
    await shot(loginPage, `${tag}-login`)
    if (w === 1280 && !reduced) metrics.axe[`login-${theme}`] = await axeViolations(loginPage)
    await loginPage.context().close()
  })

  if (wants('grid')) await guard(`${tag}-grid`, async () => {
    await openGrid(page)
    await shot(page, `${tag}-grid-filters-default`)
    await expandFilters(page)
    await shot(page, `${tag}-grid-filters-open`)
    await page.screenshot({ path: `${OUT}${tag}-grid-fullpage.png`, fullPage: true })
    metrics.shots[`${tag}-grid-fullpage`] = await measure(page)
    if (w === 1280 && !reduced) metrics.axe[`grid-${theme}`] = await axeViolations(page)
  })

  // focus ring via Tab
  if (wants('focus') && (w === 1280 || w === 300)) await guard(`${tag}-focus`, async () => {
    await openGrid(page)
    for (let i = 0; i < 6; i++) await page.keyboard.press('Tab')
    await shot(page, `${tag}-focus-tab6`)
    for (let i = 0; i < 6; i++) await page.keyboard.press('Tab')
    await shot(page, `${tag}-focus-tab12`)
    const heart = page.locator('[data-pokemon-id]').first().getByRole('button', { name: /colección/ })
    await heart.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
    await shot(page, `${tag}-focus-heart`)
  })

  if (wants('noresults')) await guard(`${tag}-noresults`, async () => {
    await openGrid(page)
    await expandFilters(page)
    await page.getByRole('searchbox').or(page.locator('input[type=search]')).or(page.getByPlaceholder(/buscar/i)).first().fill('zzzz')
    await page.waitForTimeout(1200)
    await shot(page, `${tag}-noresults`)
  })

  if (wants('detail')) await guard(`${tag}-detail`, async () => {
    await openGrid(page)
    await page.locator('[data-pokemon-id]').nth(1).locator('button').first().click()
    await page.getByRole('dialog').waitFor(); await page.waitForTimeout(900)
    await shot(page, `${tag}-detail`)
    const next = page.getByRole('dialog').getByRole('navigation', { name: DETAIL_NAV_NAME }).getByRole('button').last()
    if (await next.isEnabled()) { await next.hover(); await page.waitForTimeout(300); await shot(page, `${tag}-detail-hover-next`) }
    if (w === 1280 && !reduced) metrics.axe[`detail-${theme}`] = await axeViolations(page)
  })

  if (wants('collection')) await guard(`${tag}-collection`, async () => {
    await openCollection(page); await page.waitForTimeout(1200)
    await shot(page, `${tag}-collection`)
    await openCollection(page); await page.waitForTimeout(90)
    await shot(page, `${tag}-viewswitch-90ms`)
  })

  if (wants('pack')) await guard(`${tag}-pack`, async () => {
    await openCollection(page); await page.waitForTimeout(1000)
    const open = page.getByRole('button', { name: /Abrir sobre/ }).first()
    await open.hover(); await page.waitForTimeout(400); await shot(page, `${tag}-pack-hover`)
    await open.click(); await page.waitForTimeout(600); await shot(page, `${tag}-opening-600ms`)
    await page.waitForTimeout(800); await shot(page, `${tag}-opening-1400ms`)
    await page.waitForTimeout(2500); await shot(page, `${tag}-opened-settled`)
  })

  if (wants('empty')) await guard(`${tag}-emptycollection`, async () => {
    const emptyPage = await newPage(browser, w, h, theme, tokens.empty, reduced)
    await openCollection(emptyPage); await emptyPage.waitForTimeout(1200)
    await shot(emptyPage, `${tag}-emptycollection`)
    await emptyPage.context().close()
  })
  await page.context().close()
}

const browser = await chromium.launch()
for (const size of sizes) for (const theme of themes) await runConfig(browser, size, theme, false)
const reducedSize = sizes.find(([w]) => w === REDUCED_WIDTH)
if (reducedSize) for (const theme of themes) await runConfig(browser, reducedSize, theme, true)
await browser.close()
writeFileSync(METRICS_PATH, JSON.stringify(metrics, null, 1))
const shots = Object.entries(metrics.shots)
console.log(`${shots.length} shots, ${shots.filter(([, m]) => m.overflow).length} overflow, ${shots.filter(([, m]) => m.error).length} errors`)
