# PokéDex Manager

A web app to explore Pokémon using [PokéAPI](https://pokeapi.co/): user registration and login with JWT,
a paginated list, search by name or number, a type filter and a detail view.

- **Backend:** Python 3.12 · FastAPI · MongoDB · JWT
- **Frontend:** React · Vite · Tailwind CSS

---

## Features

- Register, log in and log out (the token is revoked on the server).
- Session kept across page reloads; an expired or invalid token sends the user back to the login.
- Form validation in the browser (HTML5) and on the server (Pydantic).
- Paginated Pokémon list (10 per page) with sprites.
- Search by name or Pokédex number (case-insensitive).
- Filter by type (Fire, Water, Grass…), also paginated.
- Detail view: sprite, name, number, types, HP / Attack / Defense, height, weight and abilities.
- Responsive layout from 320 px phones to desktop; keyboard accessible.
- Friendly error messages (not found, PokéAPI down or slow, invalid credentials).

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
│   ├── __init__.py              # App setup: lifespan (indexes), CORS, error handler, routers
│   ├── db.py                    # MongoDB client and collections
│   ├── dependencies.py          # JWT validation used to protect routes
│   ├── exceptions/pokeapi.py    # Domain errors (not found, timeout, server error)
│   ├── models/user.py           # Pydantic request/response models
│   ├── routers/                 # HTTP layer: auth.py, pokemon.py
│   ├── services/                # Logic: pokeapi.py (PokéAPI client), auth.py (hashing, JWT)
│   └── scripts/seed.py          # Test data
└── frontend/
    ├── Dockerfile               # Builds the app and serves it with nginx
    ├── nginx.conf               # Static files + proxy of /api and /auth to the API
    └── src/
        ├── api.js                   # Single place that talks to the backend
        ├── pokemonTypes.js          # Type names and their Spanish labels
        ├── App.jsx                  # Session handling: login screen or Pokédex
        └── components/              # AuthForm, PokemonBrowser, PokemonDetail
```

---

## API endpoints

### Auth

| Method | Path | Body | Responses |
|---|---|---|---|
| POST | `/auth/register` | `{ "email", "password" }` (password ≥ 8) | 201 user · 409 email taken · 422 invalid |
| POST | `/auth/login` | `{ "email", "password" }` | 200 `{ access_token, token_type }` · 401 |
| POST | `/auth/logout` | — (Bearer token) | 204 · 401 |

### Pokémon (all require `Authorization: Bearer <token>`)

| Method | Path | Query | Responses |
|---|---|---|---|
| GET | `/api/pokemon` | `limit` (1–50, default 20), `offset` (≥ 0) | 200 `{ count, results }` |
| GET | `/api/pokemon/search` | `name` (name or number) | 200 · 404 · 422 blank name |
| GET | `/api/pokemon/{id_or_name}` | — | 200 · 404 |
| GET | `/api/pokemon/type/{type_name}` | `limit`, `offset` | 200 `{ count, results }` · 404 unknown type |

Errors from PokéAPI are mapped to **502** (PokéAPI returned 5xx) and **504** (PokéAPI timed out).
Full, interactive documentation: http://localhost:8000/docs.

---

## Database

Database `pokedex`:

| Collection | Document | Indexes |
|---|---|---|
| `users` | `{ _id, email, password_hash }` | `email` unique |
| `revoked_tokens` | `{ _id: <token jti>, expires_at }` | `expires_at` TTL (MongoDB deletes each entry when the token would have expired anyway) |

Indexes are created on startup (FastAPI lifespan). Passwords are never stored in plain text.

---

## Architecture decisions

- **Layers.** Routers handle HTTP (validation, status codes); services hold the logic and do not depend
  on FastAPI. The PokéAPI service speaks PokéAPI's language and raises domain exceptions.
- **One error handler instead of try/except in every endpoint.** Domain exceptions
  (`PokemonNotFoundError`, `PokeAPITimeoutError`, `PokeAPIServerError`…) are mapped to HTTP status codes
  in a single place.
- **Custom exceptions instead of returning `None`**, so "not found" is never confused with "PokéAPI failed".
- **`*_request(client, …)` vs `*_task(…)`.** Request functions receive the HTTP client (dependency
  injection: testable and reusable); task functions own the client's lifecycle.
- **Auth.** Argon2 hashes, JWTs with `sub`, `exp` and a unique `jti`. Logout stores the `jti` in a
  denylist with a TTL index. Login returns the same error for an unknown email or a wrong password to
  prevent user enumeration. All Pokémon routes are protected at the router level.
- **Frontend.** No router library: with two screens, conditional rendering is enough. One API module adds
  the token and turns errors into a typed `ApiError`; any 401 ends the session.

## Security

- Passwords hashed with Argon2; the hash never leaves the server (`response_model`).
- Input validated with Pydantic (email format, password length, blank search, pagination limits).
- CORS restricted to the frontend origin.
- Tokens expire after 60 minutes and can be revoked.

## Performance

- Server-side pagination (`limit` capped at 50); the type filter paginates PokéAPI's full list locally.
- The list uses one request per page: sprites are built from the Pokémon id instead of fetching each
  detail (PokéAPI allows 100 requests per minute per IP).
- Images load lazily; stale responses are ignored when the user changes page quickly.

---

## What's missing and how I would do it

| Missing | How |
|---|---|
| Automated tests | pytest + FastAPI `TestClient` with a fake HTTP transport for PokéAPI and a test database; Vitest + Testing Library for the frontend; Playwright for the main flows. |
| PokéAPI cache | In-memory TTL cache (or Redis) for list, type and detail responses — the biggest win is the type filter. |
| Shared HTTP client | One `httpx.AsyncClient` created in the FastAPI lifespan and injected into the services. |
| Smaller responses | `response_model` for the detail endpoint so only the fields the UI uses are sent. |
| Safer token storage | httpOnly, `SameSite` cookie instead of `localStorage` to reduce XSS exposure. |
| Brute-force protection | Rate limiting on `/auth/login`. |
| Logging | Structured logging of PokéAPI errors and auth events. |
