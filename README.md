# PokéDex Manager

A web app to explore Pokémon using [PokéAPI](https://pokeapi.co/): user registration and login with JWT,
a paginated list, search by name or number, a type filter and a detail view.

- **Backend:** Python 3.12 · FastAPI · MongoDB · JWT
- **Frontend:** React · Vite · Tailwind CSS · react-i18next · GSAP · Lucide icons
- **Live demo:** https://pokedex.josechaparro.com — log in with any [test user](#test-users).
- **v1** (the delivered exercise) is tag [`v1.0.0`](../../tree/v1.0.0). **v2** (this branch) adds favorites,
  instant filters, booster packs, caching, rate limiting, tests and CI, a holographic detail card, Spanish and English UI and a visual polish round — see [What's new in v2](#whats-new-in-v2).

---

## Features

- Register, log in and log out (the token is revoked on the server).
- Session kept across page reloads; an expired or invalid token sends the user back to the login.
- Form validation in the browser (HTML5) and on the server (Pydantic).
- Spanish (default) or English interface; the choice is remembered and `<html lang>` follows it.
- **Instant filters:** live search by partial name or number (`/` focuses it), multi-select type chips,
  generation (I–IX and alternate forms), sort order and three card sizes — all in the URL, grouped in one
  collapsible "Filtros" card that shows the active-filter count.
- Gallery cards colored by type, with hover effects; layout changes animate with GSAP Flip.
- Paginator (24 per page) with first, previous, next and last buttons and one editable page field.
- **My collection:** favorites per user (MongoDB). A new favorite arrives as a **sealed booster pack**:
  drag its strip to tear it open (or use the button), and the opened state is saved.
- **Holographic detail card:** gold-framed artwork with rainbow foil, glitter and glare that follow the pointer
  (or the phone's gyroscope), stat bars, cry, shiny toggle, previous/next with buttons or arrow keys.
- Shareable URLs: page, filters and the open Pokémon live in the address bar; Back closes the detail.
- The detail is a native modal `<dialog>` (focus trapped, page inert) that flips in like a card being turned over.
- Light, dark or system theme with a crimson and slate palette; animated aurora background tinted by the selected types; responsive from 320 px phones to 2560 px screens; WCAG 2.2 AA (checked with axe);
  animations become fades or stay static under `prefers-reduced-motion`.
- Friendly error messages (not found, PokéAPI down or slow, invalid credentials, too many login attempts).
- Login hero and a footer with credits (author, PokéAPI, Nintendo/Game Freak disclaimer, GitHub, version).

---

## What's new in v2

Built with an agentic workflow (Claude Code): plan in [`docs/plans/2026-10-28-v2-plan.md`](docs/plans/2026-10-28-v2-plan.md),
test-first implementation, an independent review pass and small Conventional Commits.

| Area | Change |
|---|---|
| Architecture | App factory (`create_app`) as the composition root: Mongo, one shared `httpx.AsyncClient`, services and the clock are injected with `Depends`. Repositories for storage, a `PokeAPIClient` adapter for PokéAPI. |
| Performance | In-memory TTL cache (1 h) for PokéAPI; the detail response shrinks from ~300 KB to ~2 KB. |
| Features | Favorites as booster packs, Pokédex index for instant filters, partial-name autocomplete endpoint, trimmed detail model (artwork, shiny, cry, units converted). |
| Security | Failed-login rate limit (5 per email / 20 per IP per minute → 429), constant-time rejection of unknown emails, real client IP through nginx. |
| Quality | 62 backend tests (pytest), 144 frontend unit tests (Vitest), e2e and accessibility suite (Playwright on desktop and Pixel 7, axe checks), GitHub Actions CI. |
| Motion | GSAP Flip grid, booster packs, holo card, aurora background — techniques inspired by a private animation library and re-implemented from scratch; fades or static under reduced motion. |

### Polish round

- **Icons and cursors:** Lucide icons everywhere; pointer cursor on every clickable element.
- **Paginator:** one editable page field between first, previous, next and last buttons.
- **Palette:** crimson and slate as Tailwind v4 `@theme` tokens (`brand-400` to `brand-950`); new favicon and theme color.
- **Filters:** grouped in one collapsible "Filtros" card with an active-filter count.
- **Languages:** react-i18next with Spanish (default) and English; the switch is saved as `pokedex_lang` and
  `<html lang>` follows it. A unit test checks that both locales have the same keys.
- **Navigation:** sticky view tabs with a sliding indicator; the grid transitions in the direction of the tab;
  illustrated empty states.
- **Collection:** favoriting throws a Poké Ball into "Mi colección".
- **Booster packs:** hover glow, foil and tilt; the pack tears toward the side you drag. Opening runs center-stage
  (flash, particles, vibration, holo card reveal) and the card settles into its slot. Reduced motion uses fades.
- **Pokémon images:** glossy shadow and reflection underneath.
- **Login and footer:** login hero and a credits footer with the version.
- **Code splitting:** the login page no longer downloads GSAP or the browser code (login JS 143.6 → 96.3 kB gzip);
  failed chunk loads show an error with retry; the detail is preloaded when a card is hovered or focused.
- **Visual audit:** `node frontend/scripts/visual-audit.mjs [--widths=300,768,1280,2560] [--themes=light,dark] [--screens=…]`
  screenshots the app (the dev stack must be running); output goes to the git-ignored `frontend/visual-audit/`.

---

## Tech stack and why

| Technology | Why |
|---|---|
| **FastAPI** | Async (good for proxying an external API), built-in validation with Pydantic and automatic OpenAPI docs at `/docs`. |
| **httpx** | Async HTTP client with timeouts, used to call PokéAPI. |
| **MongoDB + PyMongo (async)** | Required by the exercise. A document per user fits naturally; unique and TTL indexes cover the auth needs. |
| **pwdlib (Argon2)** | Argon2 is the current recommended password hash: slow and memory-hard on purpose. |
| **PyJWT** | Stateless access tokens; revocation is added with a small denylist. |
| **uv** | Fast, reproducible Python dependency management (`uv.lock`). |
| **React + Vite** | Component-based UI with a fast dev server and build. |
| **Tailwind CSS** | Utility classes make a responsive, mobile-first layout quick to build without custom CSS. |
| **Docker Compose** | Runs the whole app (MongoDB, API and web) with one command. |

---

## Tests

```bash
docker compose up -d mongo          # the backend and e2e tests use a throwaway database on it
uv run pytest -q                    # backend (fake PokéAPI, fake clock)
cd frontend
npm test                            # unit tests (Vitest + Testing Library)
npx playwright install chromium     # once
npm run test:e2e                    # e2e + accessibility (starts API and web if they aren't running)
```

CI (GitHub Actions) runs lint, unit tests, the build and the e2e suite on every push.

---

## Getting started

### Option A — Docker (one command)

Requires only Docker.

```bash
docker compose up -d --build
docker compose exec api uv run --no-sync python src/pokedex_manager/scripts/seed.py   # test users
```

Open http://localhost:5173 (API docs at http://localhost:8000/docs).

### Option B — Local development

#### Prerequisites

- Python 3.12 and [uv](https://docs.astral.sh/uv/)
- Node.js 20.19+ (or 22.12+) and npm — required by Vite
- Docker (for MongoDB)

#### 1. Start MongoDB

```bash
docker compose up -d mongo
```

#### 2. Backend

```bash
uv sync
uv run python src/pokedex_manager/scripts/seed.py   # creates the test users
uv run fastapi dev src/pokedex_manager/__init__.py
```

The API runs at http://localhost:8000 and the interactive docs at http://localhost:8000/docs.

#### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

### Production (Dokploy or any Docker host)

`docker-compose.prod.yml` serves everything from one domain: nginx serves the web app and proxies
`/api` and `/auth` to the API, so the browser never makes cross-origin requests. MongoDB is not
exposed and requires a user and password.

Set these environment variables, then point the domain to the `web` service (port 80):

| Variable | Purpose |
|---|---|
| `JWT_SECRET_KEY` | Long random secret, e.g. `openssl rand -hex 32` |
| `MONGO_USER`, `MONGO_PASSWORD` | MongoDB credentials (alphanumeric) |

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api uv run --no-sync python src/pokedex_manager/scripts/seed.py
```

### Environment variables (optional)

All of them have local-development defaults.

| Variable | Default | Purpose |
|---|---|---|
| `MONGO_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGO_DB_NAME` | `pokedex` | Database name |
| `JWT_SECRET_KEY` | development-only value | **Must be set in production** |
| `VITE_API_URL` | `http://localhost:8000` | Backend URL used by the frontend |

### Test users

Created by the seed script (safe to run more than once):

| Email | Password |
|---|---|
| maria.garcia@example.com | Maria2026! |
| juan.lopez@example.com | JuanLopez123 |
| ana.martinez@example.com | AnaMtz2026 |
| carlos.hernandez@example.com | Carlos12345 |

---

## Project structure

```
.
├── docker-compose.yml           # Local: MongoDB, API and web
├── docker-compose.prod.yml      # Production: single domain, MongoDB with auth
├── Dockerfile                   # API image
├── pyproject.toml / uv.lock     # Python dependencies
├── src/pokedex_manager/
│   ├── __init__.py              # `app = create_app(Settings.from_env())`
│   ├── app.py                   # Composition root: lifespan, CORS, error handler, routers
│   ├── config.py                # Settings from environment variables
│   ├── cache.py / clock.py      # TTL cache and injectable clock
│   ├── dependencies.py          # Services from app.state + JWT validation
│   ├── exceptions/              # Domain errors (PokéAPI, auth)
│   ├── models/                  # Pydantic models: user, pokemon, favorite
│   ├── repositories/            # MongoDB access: users, revoked_tokens, favorites
│   ├── routers/                 # HTTP layer: auth.py, pokemon.py, favorites.py
│   ├── services/                # pokeapi.py (adapter), auth.py, search.py, rate_limit.py
│   └── scripts/seed.py          # Test data
├── tests/                       # pytest: fake PokéAPI transport, fake clock, throwaway Mongo DB
└── frontend/
    ├── Dockerfile               # Builds the app and serves it with nginx
    ├── nginx.conf               # Static files + proxy of /api and /auth to the API
    └── src/
        ├── api.js                   # Single place that talks to the backend
        ├── pokemonTypes.js          # Type names and their Spanish labels
        ├── App.jsx                  # Session handling: login screen or Pokédex
        ├── urlState.js              # Navigation state <-> query string
        ├── pokedexFilter.js         # Instant filtering, sorting and pagination over the Pokédex index
        ├── flyToCollection.js       # Sprite flies into "Mi colección" when added
        ├── viewTransition.js        # Direction of the grid slide between view tabs
        ├── packOpening.js           # Center-stage booster pack opening sequence
        ├── lazyComponents.js        # Code-split chunks: browser and detail dialog
        ├── i18n/                    # react-i18next setup and locales (es, en)
        ├── hooks/                   # useUrlState, useFavorites, usePokedexIndex, useFlipGrid, useTheme, useTilt
        └── components/              # PokemonBrowser, FilterBar, Paginator, PokemonCard, PokemonCardFace, BoosterPack, PackStage, PokemonDetail, HoloCard, ViewTabs, EmptyState, AppFooter, BrandTitle, LanguageToggle, ChunkErrorBoundary…
    └── e2e/                         # Playwright flows + axe accessibility checks
```

---

## API endpoints

### Auth

| Method | Path | Body | Responses |
|---|---|---|---|
| POST | `/auth/register` | `{ "email", "password" }` (password ≥ 8) | 201 user · 409 email taken · 422 invalid |
| POST | `/auth/login` | `{ "email", "password" }` | 200 `{ access_token, token_type }` · 401 · 429 too many failed attempts (`Retry-After`) |
| POST | `/auth/logout` | — (Bearer token) | 204 · 401 |

### Pokémon (all require `Authorization: Bearer <token>`)

| Method | Path | Query | Responses |
|---|---|---|---|
| GET | `/api/pokemon` | `limit` (1–50, default 20), `offset` (≥ 0) | 200 `{ count, results }` |
| GET | `/api/pokemon/index` | — | 200 `[{ id, name, types }]` for every Pokémon (cached; powers the instant filters) |
| GET | `/api/pokemon/suggest` | `q` (partial name or number), `limit` (1–20, default 8) | 200 `[{ id, name }]` · 422 blank |
| GET | `/api/pokemon/search` | `name` (name or number) | 200 detail · 404 · 422 blank name |
| GET | `/api/pokemon/{id_or_name}` | — | 200 detail · 404 |
| GET | `/api/pokemon/type/{type_name}` | `limit`, `offset` | 200 `{ count, results }` · 404 unknown type |

### Favorites (require a token; each user only sees their own)

| Method | Path | Responses |
|---|---|---|
| GET | `/api/me/favorites` | 200 `[{ pokemon_id, name, added_at, opened }]` (oldest first) |
| PUT | `/api/me/favorites/{pokemon_id}` | 200 favorite (idempotent) · 404 unknown Pokémon · 422 invalid id |
| POST | `/api/me/favorites/{pokemon_id}/open` | 200 favorite with `opened: true` · 404 not a favorite |
| DELETE | `/api/me/favorites/{pokemon_id}` | 204 (idempotent) |

The detail model is `{ id, name, types, height_m, weight_kg, abilities[{name, is_hidden}], stats[{name, value}],
images{sprite, shiny, artwork}, cry }`.

Errors from PokéAPI are mapped to **502** (PokéAPI returned 5xx) and **504** (PokéAPI timed out).
Full, interactive documentation: http://localhost:8000/docs.

---

## Database

Database `pokedex`:

| Collection | Document | Indexes |
|---|---|---|
| `users` | `{ _id, email, password_hash }` | `email` unique |
| `revoked_tokens` | `{ _id: <token jti>, expires_at }` | `expires_at` TTL (MongoDB deletes each entry when the token would have expired anyway) |
| `favorites` | `{ user_id, pokemon_id, name, added_at, opened }` | `(user_id, pokemon_id)` unique · `(user_id, added_at)` |

Indexes are created on startup (FastAPI lifespan). Passwords are never stored in plain text.

---

## Architecture decisions

- **Layers.** Routers handle HTTP (validation, status codes); services hold the logic and do not depend
  on FastAPI. The PokéAPI service speaks PokéAPI's language and raises domain exceptions.
- **One error handler instead of try/except in every endpoint.** Domain exceptions
  (`PokemonNotFoundError`, `PokeAPITimeoutError`, `PokeAPIServerError`…) are mapped to HTTP status codes
  in a single place.
- **Custom exceptions instead of returning `None`**, so "not found" is never confused with "PokéAPI failed".
- **Composition root + dependency injection.** `create_app(settings, pokeapi_transport, clock)` wires Mongo,
  one shared `httpx.AsyncClient`, repositories and services; routes receive them with `Depends`. Tests pass
  a fake PokéAPI transport, a fake clock and a throwaway database — no monkeypatching of globals.
- **Adapter and Repository patterns.** `PokeAPIClient` is the only code that knows PokéAPI's shapes and
  turns them into small models; repositories are the only code that knows how documents are stored.
- **Auth.** Argon2 hashes, JWTs with `sub`, `exp` and a unique `jti`. Logout stores the `jti` in a
  denylist with a TTL index. Login returns the same error for an unknown email or a wrong password to
  prevent user enumeration. All Pokémon routes are protected at the router level.
- **Frontend.** No router library: the URL query string is the navigation state (`useUrlState`), which gives
  shareable links and Back/Forward without a dependency. One API module adds the token and turns errors into
  a typed `ApiError`; any 401 ends the session. Favorites update optimistically and roll back on failure.

## Security

- Passwords hashed with Argon2; the hash never leaves the server (`response_model`).
- Input validated with Pydantic (email format, password length, blank search, pagination limits).
- CORS restricted to the frontend origin.
- Tokens expire after 60 minutes and can be revoked.
- Failed logins are rate-limited per email and per IP (in memory: one API process; Redis for several).
  Trade-off: anyone can lock an email out for one minute by failing 5 times — a CAPTCHA (e.g. Turnstile)
  after a few failures would remove that.
- Unknown emails still run a password verification, so response time doesn't reveal registered accounts.
- nginx passes the real client IP (`real_ip` from private-network proxies only), so it can't be spoofed
  with a client-supplied `X-Forwarded-For`.

## Performance

- Server-side pagination (`limit` capped at 50); the type filter paginates PokéAPI's full list locally.
- PokéAPI responses are cached in memory for an hour, so the type filter downloads the type list once and
  autocomplete uses one cached name index (~1,300 names).
- The list uses one request per page: sprites are built from the Pokémon id instead of fetching each
  detail (PokéAPI allows 100 requests per minute per IP).
- Images load lazily; stale responses are ignored when the user changes page quickly.

---

## What's missing and how I would do it

| Missing | How |
|---|---|
| Safer token storage | httpOnly, `SameSite` cookie instead of `localStorage` to reduce XSS exposure. |
| Shared cache / limiter | Redis, so several API replicas share the cache and the login limits. |
| Bot protection | Cloudflare Turnstile on register and after repeated failed logins. |
| PWA | Vite PWA plugin: installable app and offline cache of visited Pokémon. |
| Logging | Structured logging of PokéAPI errors and auth events. |
