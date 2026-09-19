# SiteSignal — Build Roadmap

Portfolio-quality SEO intelligence platform. Monorepo: `/frontend` (Next.js 16 App Router) + `/backend` (FastAPI).

Legend: `[ ]` todo · `[~]` in progress · `[x]` done

## Phase 1 — Foundation
- [x] Check Node/Python versions, confirm Next.js version, read Next 16 docs (proxy.ts replaces middleware.ts, `cookies()`/`headers()` are async)
- [x] `git init` at repo root
- [x] Scaffold `/frontend` with `create-next-app` (TS, Tailwind, App Router, src dir)
- [x] Scaffold `/backend` (FastAPI app skeleton: core/, db/, models/, schemas/, api/routes/, crawler/, analysis/, tests/)
- [x] `docker-compose.yml` at repo root for local Postgres 16 (dev-only creds: sitesignal/sitesignal, host port 5433 to avoid a native Postgres already on 5432)
- [x] SQLAlchemy 2.0 typed models (User, Website, Audit, Page, SEOIssue, Link, Opportunity) with UUID PKs
- [x] Alembic setup, `env.py` reads from app `Settings` (not hardcoded URL), initial migration
- [x] `backend/.env.example` + `frontend/.env.example`
- [x] Health-check round trip: FastAPI `/api/health` <- Next.js Server Component fetch, rendered on a page
- [x] Verify: `docker compose up`, backend boots, migration runs, frontend renders health status

## Phase 2 — Auth + website management
- [x] Backend: `users` table, bcrypt (direct, not passlib) hashing, `/api/auth/register`, `/api/auth/login` issuing short-lived JWT, generic error for bad login (no email enumeration)
- [x] Frontend: NextAuth v5 Credentials provider calling backend login server-side; `jwt()` callback stores `access_token`; **not** exposed via `session()`
- [x] `getBackendAccessToken()` server-only helper using `next-auth/jwt` `getToken()`
- [x] `proxy.ts` optimistic auth redirect (protected app routes vs public routes)
- [x] Website CRUD: add (normalize URL + SSRF check at add-time), list, delete (with confirmation on Settings page)
- [x] Dashboard shell: sidebar (Overview, Opportunities, Pages, Issues, Internal Links, Performance [Coming soon], Search Console [Coming soon], Settings), topbar, responsive (mobile horizontal tab bar fallback)
- [x] Verify: register, login, add website, see it listed, logout, protected routes redirect when logged out — confirmed via curl-driven SSR checks (real NextAuth credentials login flow, cookie-authenticated requests) since no browser automation tool was available in this session; every route checked returns 200 with real rendered content, and `proxy.ts` redirects verified both directions (logged-out -> /login, logged-in -> /dashboard)

## Phase 3 — Crawler
- [x] URL normalization (lowercase scheme/host, strip fragments/default ports, reject embedded creds, resolve relative URLs)
- [x] SSRF guard: scheme allowlist, DNS resolve + IP blocklist (loopback, link-local incl. 169.254/fe80::/10, private RFC1918, CGNAT 100.64/10, doc ranges, multicast, unspecified), re-check every redirect hop (manual redirect loop, `follow_redirects=False`), reject creds-in-URL, timeout + response size cap
- [x] Document TOCTOU/DNS-rebinding residual gap in README (README section "SSRF protection")
- [x] httpx + BeautifulSoup(lxml) fetcher/parser: status, canonical, title, meta description, H1/H2s, word count, internal/external link counts, images+alt, robots meta, depth, response time, redirect count
- [x] BFS crawl orchestrator, same-domain, dedupe, cap ~100 pages + max depth
- [x] `Link` table (source_page_id -> destination_page_id | destination_url)
- [x] Audit creation via FastAPI `BackgroundTasks` (structured to swap to Celery later), audit status polling endpoint (`/audits`, `/audits/latest`, `/audits/{id}`)
- [x] Frontend: "Start audit" flow with pre-crawl explanation, live-updating progress (pages crawled/limit, elapsed time), polling via a same-origin Route Handler proxy
- [x] Unit tests: normalization, SSRF blocklist (loopback/private/link-local/unresolvable/public), parser
- [x] Integration test: full crawl against local `http.server` test fixture

## Phase 4 — SEO rules engine
- [x] Pure-function rules: titles (missing/short/long/duplicate), meta desc (missing/short/long/duplicate), H1 (missing/multiple/empty), thin content (2 thresholds), broken internal links, low incoming internal links, missing alt text, noindex, canonical mismatch, non-200 pages, slow response, redirect chains
- [x] Skip on-page/content rules for non-200 pages
- [x] Issue shape: issue_type, severity (Critical/Warning/Opportunity), category (Technical/On-page/Content/Internal linking/Indexability), explanation, recommended action
- [x] Unit tests per rule (isolation) — 37 tests in test_rules.py

## Phase 5 — Opportunity engine
- [x] Aggregate issues by issue_type into ranked opportunities
- [x] Transparent scoring: severity_weight × log-scaled(affected_page_count) × depth_factor × effort_multiplier — all inputs derivable from stored rows (score_breakdown JSONB column)
- [x] Code comment documenting Phase 9 expansion (search_demand × ranking_potential × ctr_gap × business_relevance) — no fabricated numbers now
- [x] Unit tests: severity ordering, count scaling, sort order

## Phase 6 — Dashboard wired to real data
- [x] Backend read endpoints: GET pages (list+detail), issues, opportunities, internal-links, all scoped by owned website + audit
- [x] Per-website dashboard: site health (secondary indicator, derived from real issue counts — not a fabricated score), Top Opportunities, Issues by Category (Recharts horizontal bar, single-hue, direct-labeled per the dataviz skill)
- [x] Pages table: sortable/filterable (search + status filter), links to page detail
- [x] Page detail: full page data + issues + recommended actions + images/alt audit
- [x] Internal Links view: incoming/outgoing counts, few-incoming-links flag (schema ready for future graph viz)
- [x] No static/fake placeholder data anywhere — verified end-to-end against a real crawl of example.com and inspected the resulting DB rows directly

## Phase 7 — Onboarding & polish
- [x] First-run "Getting started" checklist (Add website → Run audit → Review opportunities → Explore a page), each step linking straight to the relevant action, completed state derived from real data (websites exist / any completed audit / dismissed_hints), dismissible (persisted via `has_seen_intro`)
- [x] Pre-crawl explanation copy before "Start audit" (on both the add-website page and the empty Overview state)
- [x] One-time contextual tooltips per section (Opportunities/Pages/Page detail) — custom `SectionIntro` component, persisted per-user via backend `dismissed_hints` (not localStorage/session), never a heavy tour library
- [x] Empty states everywhere explain what's next (no websites, no audit yet per section, zero issues, filter with no matches)
- [x] Loading states show real progress (pages crawled/limit, elapsed time), never a bare spinner — `AuditProgress` polls every 1.5s
- [x] Landing page: hero, "how it works" (4 steps), CTA, no fake logos/testimonials/stats
- [x] Every async action: loading/disabled state (`Button` `loading` prop), inline success/error feedback (toasts wired for delete-website errors; inline success banner after adding a website; inline errors on every form)
- [x] Destructive actions confirm first — custom `ConfirmDialog` (Escape-to-close, focus management) used for website removal
- [x] Full keyboard usability + visible focus states (global `:focus-visible` outline); responsive to small viewport (mobile horizontal tab bar for website nav, responsive grids throughout)

## Phase 8 — Deployment prep
- [x] Vercel config for frontend (no custom config needed — standard Next.js App Router app; documented in README)
- [x] Railway/Render config for backend + Postgres (`backend/render.yaml` blueprint, `backend/Procfile` for Railway)
- [x] Secrets checklist (README "Secrets checklist" section)
- [x] Final README pass (architecture, auth design, crawling, analysis, database design, local dev, env vars, security incl. SSRF residual gap, roadmap)
- [ ] Actually deploying to Vercel/Railway/Render — not done (needs real accounts/credentials, which weren't available in this session); all config and docs are in place for whenever that happens

## Phase 9 — Advanced (later, not started until 1–8 solid)
- [ ] Google Search Console integration
- [ ] PageSpeed Insights integration
- [ ] Internal link graph visualization
- [ ] Historical audit comparisons

## Notes / decisions log
- Next.js 16.3.5 installed — `proxy.ts` replaces `middleware.ts` (same behavior); `cookies()`/`headers()` are async APIs.
- Python 3.12 (via Homebrew) used for backend instead of system 3.9.6.
- Auth: FastAPI owns users + JWT issuance; NextAuth Credentials provider is a thin server-side wrapper; backend token lives only in the NextAuth JWT (`jwt()` callback), never in the `session()` object exposed to the browser.
- Local Postgres runs on host port **5433**, not 5432 — a native Postgres was already running on 5432 on the dev machine; `docker-compose.yml`, both `.env.example` files, and the README all reflect 5433.
- No browser automation tool (built-in browser or Claude in Chrome) was available in this session, so UI verification was done via curl-driven SSR checks against a real NextAuth-authenticated session (registration, login, every route's response code + rendered content, auth redirects both directions) rather than a visual pass. Visual/CSS polish has not been eyeballed in an actual browser — worth a manual look before calling this fully done.
- Backend test suite: 94 tests passing (`cd backend && pytest`), including one full integration test (crawl → parse → rules → opportunities) against a local `http.server` fixture.
- Frontend: `tsc --noEmit`, `npm run lint`, and `npm run build` all pass cleanly.
