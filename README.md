# SiteSignal

An SEO intelligence platform: point it at a website, it crawls the site,
runs a deterministic rules engine over what it finds, and turns the results
into a ranked, explainable list of what to fix next. The name is arbitrary
and isolated to `frontend/src/lib/config.ts` (`APP_NAME`) — rebranding is a
one-line change.

This README is written for engineers, not as a product pitch: what the
system does, why it's built this way, and how to run it.

## Why this exists

Most "SEO score" tools are a black-box number with no way to see how it was
computed. SiteSignal is built around the opposite principle: every
recommendation traces back to a specific, real fact the crawler observed
(a missing title, a 404, a page with three incoming links), and every score
is a small formula whose inputs are all visible in the database. There is no
AI in the analysis path — the crawl → parse → rules → opportunity pipeline
is entirely deterministic. AI is a plausible future addition for explaining
results in plain language, not for deciding what's wrong with a page.

## Architecture

```
frontend/                     Next.js 16 (App Router), TypeScript, Tailwind
  src/app/                    Routes: (auth) group, (app) group (dashboard + per-website)
  src/auth.ts                 NextAuth v5 config (Credentials provider)
  src/proxy.ts                Optimistic auth redirect (Next 16's renamed middleware.ts)
  src/lib/backend.ts          Server-only fetch wrapper that attaches the backend JWT
  src/lib/backend-session.ts  Reads the backend token out of the NextAuth JWT

backend/
  app/core/                   Settings (env), password hashing, JWT issuance
  app/db/                     SQLAlchemy engine/session, declarative Base
  app/models/                 SQLAlchemy 2.0 typed models (UUID PKs)
  app/schemas/                Pydantic request/response shapes
  app/api/routes/             FastAPI routers (auth, users, websites, audits, audit_data)
  app/crawler/                normalize, ssrf, fetcher, parser, orchestrator
  app/analysis/                rules engine + opportunity engine + DB pipeline
  app/tests/                  pytest — unit + one full-pipeline integration test
```

### Auth: two systems sharing identity without leaking secrets to the browser

FastAPI owns the `users` table, password hashing, and issues its own
short-lived JWT (`/api/auth/login`, `/api/auth/register`). NextAuth's
Credentials provider is a thin server-side wrapper: its `authorize()` calls
FastAPI's login endpoint, and the `jwt()` callback stores the resulting
`access_token` on the NextAuth JWT. Critically, `session()` **never** copies
that token onto the object it returns — `useSession()` and
`/api/auth/session` expose that object to client-side JS, so anything placed
there is visible to the browser.

To call the backend on the user's behalf, server-side code uses
`getBackendAccessToken()` (`frontend/src/lib/backend-session.ts`), which
reads the token back out with `next-auth/jwt`'s `getToken()` — bypassing the
`session()` shaping entirely — never `auth()`. Every backend call from the
frontend goes through `backendFetch()` (Server Components for reads, Server
Actions / Route Handlers for writes); nothing ever calls the backend
directly from client-side JS with a token in hand. The one exception is the
audit-progress poller, which is a client component — it polls a same-origin
Next.js Route Handler (`/api/websites/[id]/audits/[id]`), which itself
attaches the token server-side before forwarding to FastAPI.

### How crawling works

Given a root URL, the crawler (`app/crawler/`):

1. **Normalizes** the URL (`normalize.py`): lowercases scheme/host, strips
   the fragment and default port, resolves relative URLs against a base,
   and rejects embedded credentials (`http://user:pass@host`) or non-http(s)
   schemes.
2. **Validates it's safe to fetch** (`ssrf.py`) — see the SSRF section below.
3. **BFS-crawls** from the homepage (`orchestrator.py`), staying on the same
   domain, deduping by normalized URL, capped at `CRAWL_MAX_PAGES` (default
   100) and `CRAWL_MAX_DEPTH` (default 5).
4. **Fetches each URL** (`fetcher.py`) via httpx with `follow_redirects=False`
   and a manual redirect loop — every hop is re-validated against the SSRF
   blocklist before being fetched, capped at 5 hops, with a per-request
   timeout and a streamed response-size cap.
5. **Parses each page** (`parser.py`) with BeautifulSoup(lxml): title, meta
   description, H1s/H2s, word count, canonical URL, robots meta →
   indexability, images + alt text, and outgoing links (with anchor text).
6. **Persists** a `Page` row per URL and a `Link` row per hyperlink found
   (`source_page_id → destination_page_id | destination_url`), so the
   internal-link graph is queryable later without a rewrite.
7. Progress (`pages_crawled` on the `Audit` row) is updated after every page,
   so the frontend's polling progress bar reflects the crawl live rather
   than showing a static spinner for up to a minute.

The crawl runs via FastAPI's `BackgroundTasks`, calling a single sync
entrypoint (`run_audit_task`) that opens its own DB session and drives the
async crawl with `asyncio.run(...)`. Swapping this for Celery/Redis later
means pointing a Celery task at `run_audit_task` — nothing in the crawl,
parse, or analysis code needs to change.

### SSRF protection

The crawler fetches arbitrary user-supplied URLs on the server's behalf —
a classic vector for reaching cloud metadata endpoints, the app's own
database, or other internal services. `app/crawler/ssrf.py`:

- Allows only `http`/`https` schemes.
- **Resolves the hostname via DNS and checks every resolved IP** against an
  explicit blocklist — loopback (`127.0.0.0/8`, `::1`), link-local
  (`169.254.0.0/16`, `fe80::/10` — this is where cloud metadata endpoints
  live), RFC1918 private ranges, CGNAT (`100.64.0.0/10`), documentation
  ranges, multicast, and unspecified/reserved addresses — plus Python's
  `ipaddress` `is_private`/`is_loopback`/`is_link_local`/`is_reserved`
  /`is_multicast`/`is_unspecified` as a redundant safety net. Checking the
  *resolved IP* matters: checking only the hostname string misses a hostname
  that resolves to a private IP.
- Re-runs this exact check **on every redirect hop**, not just the original
  URL — redirects are followed manually (`follow_redirects=False` + a loop
  in `fetcher.py`) so each hop is validated before being fetched, capped at
  5 hops.
- Rejects URLs with embedded credentials.
- Enforces a per-request timeout and a streamed response-size cap.

**Known residual gap, documented rather than hidden:** there's a small
TOCTOU window between the DNS check and the actual outbound connection —
an attacker-controlled DNS record could resolve to a public IP during the
check and then be "rebound" to a private IP by the time httpx actually
connects. The correct next hardening step is pinning the validated IP for
the real socket connection via a custom httpx transport, so the connection
reuses the exact address that was checked instead of re-resolving. Not
implemented yet.

### How analysis works

`app/analysis/rules.py` is a set of pure functions —
`(page: PageData, context: AuditContext) -> list[IssueDraft]` — each
checking one thing: missing/short/long/duplicate titles, missing/short/long
/duplicate meta descriptions, missing/multiple/empty H1s, thin content (two
thresholds), missing alt text, noindex, canonical mismatches, non-200 pages,
slow responses, redirect chains, broken internal links, and pages with few
incoming internal links. Content/on-page rules are skipped for any page that
didn't return a 2xx (`page.is_success`) — there's nothing meaningful to say
about the title of a 404. Every threshold lives in `thresholds.py`, not
buried in conditionals.

`app/analysis/opportunity_engine.py` aggregates same-type issues across
pages into one ranked `Opportunity` ("Add titles to 7 pages," not seven
rows), scored as:

```
opportunity_score = severity_weight × log2(affected_page_count + 1) × depth_factor × effort_multiplier
```

Every factor (`severity_weight`, `affected_page_count`, `log_scaled_count`,
`average_crawl_depth`, `depth_factor`, `effort_multiplier`) is stored on the
`Opportunity.score_breakdown` JSONB column, so the score is inspectable, not
a black box. **Phase 9** (not built, and deliberately not faked with
placeholder numbers) will expand this once Google Search Console data
exists, to `search_demand × ranking_potential × ctr_gap × business_relevance`.

## Database design

UUID primary keys throughout. `Audit` rows are never overwritten — every
crawl creates a new one — so audit history accumulates and nothing here
blocks adding historical comparisons later.

```
User ──< Website ──< Audit ──< Page ──< SEOIssue
                        │        │
                        │        └──< Link (source_page_id → destination_page_id | destination_url)
                        └──< Opportunity
```

Cascade deletes: removing a `Website` cascades to its `Audit`s, which
cascade to `Page`s, `SEOIssue`s, `Opportunity`s, and `Link`s. A `Link`'s
destination uses `ON DELETE SET NULL` (the link row survives if its
destination `Page` is deleted, since `destination_url` is stored
independently). Every route that scopes to "the current user's data"
filters by owner ID *in the query itself* (see `get_owned_website` /
`get_owned_audit` in `app/api/deps.py`) — an ID alone can never return
another user's website, audit, or page.

## Tech stack

- **Frontend:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, Recharts, lucide-react
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 (typed `Mapped[...]`), Alembic, httpx, BeautifulSoup4 (lxml)
- **Database:** PostgreSQL 16
- **Auth:** NextAuth.js (Auth.js) v5 Credentials provider + FastAPI-issued JWTs
- **Background work:** FastAPI `BackgroundTasks` today, structured to swap to Celery/Redis without touching crawl/analysis code

## Running locally

### Prerequisites

- Node.js 20+, Python 3.12, Docker

### 1. Database

```bash
docker compose up -d
```

Starts Postgres 16 on **host port 5433** (not 5432 — this avoids colliding
with a Postgres instance that might already be running natively on the
host; see `docker-compose.yml`), with dev-only credentials
`sitesignal` / `sitesignal`.

### 2. Backend

```bash
cd backend
python3.12 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# generate your own secret and drop it into .env:
python -c "import secrets; print(secrets.token_urlsafe(48))"
alembic upgrade head
uvicorn app.main:app --reload --port 8001
```

Health check: `curl http://127.0.0.1:8001/api/health`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# generate your own secret:
openssl rand -base64 32
npm run dev
```

Visit `http://localhost:3000` (or whatever port Next.js picks if 3000 is
busy — it will tell you).

### Running tests

```bash
cd backend
# one-time: create a dedicated test database (never the dev one)
docker exec sitesignal-db psql -U sitesignal -d sitesignal -c "CREATE DATABASE sitesignal_test;"
pytest
```

94 tests: URL normalization, the SSRF blocklist (loopback / private /
link-local / CGNAT / documentation ranges / unresolvable / public IPs), the
HTML parser, every SEO rule in isolation, the opportunity scoring formula
(severity ordering, page-count log-scaling, sort order), and one full
integration test that runs crawl → parse → rules → opportunities against a
local `http.server` fixture (not a live site — CI/sandbox environments often
restrict outbound network, so the suite never depends on it).

## Environment variables

See `backend/.env.example` and `frontend/.env.example`. Never commit `.env`
or `.env.local` — both are gitignored. Notable ones:

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | Postgres connection string — the *only* place it's configured; Alembic's `env.py` reads it from here rather than `alembic.ini` |
| `JWT_SECRET` | backend | Signs backend-issued JWTs; generate with `secrets.token_urlsafe(48)` |
| `CORS_ORIGINS` | backend | Comma-separated allowlist — never a wildcard combined with credentials |
| `CRAWL_MAX_PAGES` / `CRAWL_MAX_DEPTH` | backend | Crawl caps |
| `AUTH_SECRET` | frontend | NextAuth JWT signing secret; generate with `openssl rand -base64 32` |
| `BACKEND_URL` | frontend | FastAPI base URL — server-side only, never exposed to the browser |

## Security notes

- Passwords are hashed with `bcrypt` directly (not `passlib`, which is
  unmaintained and its `bcrypt>=4.1` compatibility shim is broken). Input is
  explicitly truncated to bcrypt's 72-byte limit, and the registration
  schema caps password length at 72 so that's a documented decision, not a
  silent surprise.
- Login returns the same generic error for "wrong password" and "no such
  user," so the endpoint can't be used to enumerate registered emails.
- JWTs are short-lived (1 hour default).
- CORS is an explicit origin allowlist, never `*` with credentials.
- SSRF protections are described in detail above, including the one
  residual gap that's intentionally left for a future hardening pass.
- Every "current user's data" query filters by owner ID in the query itself
  — see `get_owned_website`/`get_owned_audit` in `app/api/deps.py`.

## Deployment

Frontend → Vercel, backend + Postgres → Railway or Render. Deploy the
backend first so you have its URL for the frontend's `BACKEND_URL`.

### Backend (Render)

`backend/render.yaml` is a Render Blueprint — connect the repo in the Render
dashboard, point it at this file, and it provisions a Postgres 16 instance
and a web service together. It runs `alembic upgrade head` before starting
`uvicorn` on every deploy. After the frontend is deployed, come back and set
`CORS_ORIGINS` to its real URL (the blueprint leaves this one manual on
purpose — `sync: false` — since the value doesn't exist until the frontend
does).

### Backend (Railway)

Railway doesn't need a blueprint file: create a Postgres plugin, create a
service from this repo with root directory `backend`, and set its start
command to `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
(the same as `backend/Procfile`). Set the env vars listed below.

### Frontend (Vercel)

Import the repo, set the root directory to `frontend`, and set the env vars
below. No custom build config needed — it's a standard Next.js App Router
app.

Hosted Vercel/Render frontend builds reject missing or malformed `BACKEND_URL`,
loopback API addresses, and a missing/placeholder `AUTH_SECRET`. Set `BACKEND_URL`
to the API origin only (no `/api` suffix). Auth requests allow up to 120 seconds
for the API to respond, with a 180-second auth route budget where supported by
the host. Requests that create accounts are never automatically retried.
These checks cannot provision an API or guarantee hosting uptime.

Production frontend: `https://site-signal-phi.vercel.app`.
Production Vercel `BACKEND_URL`: `https://sitesignal-lyl1.onrender.com`.
Render `CORS_ORIGINS`: `https://site-signal-phi.vercel.app`.
The frontend's `/api/health` checks the live API and its database and returns
HTTP 503 on failure; it never returns connection strings or secrets.
Auth uses server-side requests, so browser CORS does not control that connection.

Production smoke test (creates one disposable test account):

```bash
cd backend
venv/bin/python scripts/smoke_production_auth.py https://site-signal-phi.vercel.app https://sitesignal-lyl1.onrender.com
```

This submits the live rendered signup/login forms over HTTP, checks secure
sessions and the dashboard, and authenticates the same account against Render.
It also checks the frontend-to-backend health endpoint and production CORS.

### Secrets checklist

Generate fresh values for production — never reuse the ones in a local
`.env`:

- [ ] Backend `JWT_SECRET` — `python -c "import secrets; print(secrets.token_urlsafe(48))"`
- [ ] Backend `DATABASE_URL` — from the hosting platform's managed Postgres
- [ ] Backend `CORS_ORIGINS` — the deployed frontend's exact origin (no wildcard)
- [ ] Frontend `AUTH_SECRET` — `openssl rand -base64 32`
- [ ] Frontend `BACKEND_URL` — the deployed backend's URL
- [ ] Confirm `.env` / `.env.local` are not committed (`.gitignore` already excludes them)

## Roadmap

Phases 1–7 (foundation, auth, crawler, rules engine, opportunity engine,
dashboard, onboarding/polish) are built and tested. Not yet started, by
design (see `TODO.md` for the live checklist):

- **Deployment** — frontend to Vercel, backend + Postgres to Railway/Render.
- **Google Search Console integration** — real query/impression/click data,
  feeding the Phase 9 opportunity scoring formula described above.
- **PageSpeed Insights integration** — Core Web Vitals, powering the
  "Performance" tab (currently an honest "coming soon" placeholder, not
  faked data).
- **Internal link graph visualization** — the `Link` table's schema
  (`source_page_id → destination_page_id`) already supports this without a
  rewrite.
- **Historical audit comparisons** — `Audit` rows already accumulate rather
  than overwrite, so this is a UI feature, not a schema change.

## Project structure conventions

- No giant files: routes, schemas, and models are split by domain.
- Rules and scoring are pure functions with no DB/network access, so they're
  trivially unit-testable — see `app/tests/test_rules.py` and
  `test_opportunity_engine.py`.
- The frontend never calls the backend from client-side JS with a token in
  hand — see the Auth section above.
