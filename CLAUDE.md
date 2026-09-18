# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state — read this first

This repo was originally wired as three git **submodules** (`TheBayHome-Frontend`, `TheBayHome-AdminPanel`, `TheBayHome-Backend`), but it ships with no `.gitmodules` file, so the submodule links were broken and the folders were empty on checkout.

- `TheBayHome-Frontend` and `TheBayHome-AdminPanel` have been pulled in as regular (non-submodule) files from their upstream repos (`github.com/ashraf-work/TheBayHome-Frontend` and `github.com/ashraf-work/TheBayHome-AdminPanel`), at the exact commits this repo originally pinned. They are real, readable source going forward.
- `TheBayHome-Backend` is a **new backend written from scratch** for this POC — no public repo for the original Mongo/Express backend the README describes could be located, so rather than leaving it missing, a Node/Express/Prisma/Postgres backend was built against the exact REST contract the frontend and admin panel already expect (see `src/services/api.js` and `src/lib/api.js` in those two apps). It intentionally covers the booking workflow + admin panel surface only (auth, properties, seasons/pricing, bookings, users, dashboard analytics) — it does **not** implement the blog CMS, things-to-do CMS, or error-log endpoints those two frontends also call; those routes will 404.

## What this project is

**StayNest** ("TheKeysVibe" in code) is a full-stack Airbnb-style vacation rental booking platform for boutique properties in the Florida Keys, split into three apps:

| App | Folder | Stack | Purpose |
|---|---|---|---|
| Public website | `TheBayHome-Frontend` | Next.js 16 / React 19 | Customer-facing booking site |
| Admin console | `TheBayHome-AdminPanel` | Vite / React 19 | Internal ops dashboard + CMS |
| Backend API | `TheBayHome-Backend` | Express 5 / PostgreSQL (Prisma) | REST API, auth, bookings, seasonal pricing, admin ops |

The backend is expected at `http://localhost:8001/api` in local dev.

## Commands

### Frontend (`TheBayHome-Frontend`)
```bash
cd TheBayHome-Frontend
npm install
npm run dev      # next dev on 0.0.0.0:4000
npm run build    # next build
npm run serve    # next start on 0.0.0.0:4000 (serves the production build)
npm run lint      # eslint .
```
No test script is defined.

### Admin panel (`TheBayHome-AdminPanel`)
```bash
cd TheBayHome-AdminPanel
npm install       # package.json declares yarn as packageManager, but no yarn.lock is committed — npm works
npm run dev       # vite dev server on 0.0.0.0:5173
npm run build     # vite build
npm run preview   # vite preview on 0.0.0.0:4173
npm run lint       # eslint src --ext .js,.jsx
```
No test script is defined.

### Backend (`TheBayHome-Backend`)
```bash
cd TheBayHome-Backend
docker compose up -d         # local Postgres on localhost:5434 (see docker-compose.yml)
cp .env.example .env          # then set JWT_SECRET to a real random value
npm install
npx prisma migrate dev        # applies schema, generates client
node prisma/seed.js           # admin@thekeysvibe.com / Admin123!, guest@thekeysvibe.com / Guest123!, 3 demo properties
npm run dev                   # node --watch src/server.js, serves http://localhost:8001/api
```
No test script is defined. `npm run lint` runs eslint.

Frontend/admin panel need to point at it: `TheBayHome-Frontend/.env.local` sets `NEXT_PUBLIC_API_BASE_URL=http://localhost:8001` (no `/api` suffix — the client appends that itself; leaving this unset falls back to a URL that double-prefixes `/api` and breaks server-side fetches), and `TheBayHome-AdminPanel/.env.local` sets `VITE_API_URL=http://localhost:8001/api` (this one *does* want the suffix, since its axios calls omit it). Both are gitignored — recreate them from this note if missing. Next.js caches server-rendered `fetch()` calls to disk (`.next/cache`) for 5 minutes; if you change backend data and don't see it reflected, that's why — `rm -rf .next/cache` or wait it out.

Prisma's CLI refuses to run `migrate reset` (or other destructor commands) when it detects it's being driven by an AI agent, without the user's explicit in-the-moment consent — don't try to work around that gate. To wipe dev data, delete rows directly with Prisma Client instead (see git history around 2026-09-18 for the pattern used).

## Architecture

### Frontend — `TheBayHome-Frontend` (Next.js App Router)
- Routes live under `src/app/` (App Router — one folder per route: `properties/[id]`, `blogs/[id]`, `checkout`, `bookings`, `things-to-do/[id]`, `login`, `signup`, `forgot-password`, `reset-password`, `settings`, etc.).
- `src/services/api.js` is the single API client. It builds requests against `${NEXT_PUBLIC_API_BASE_URL}/api/...`, sends `credentials: "include"` (cookie-based sessions), and branches caching behavior by environment: server-side GETs use `fetch`'s `cache`/`next.revalidate` (default 300s), client-side and non-GET requests use `no-store`.
- `next.config.mjs` rewrites `/api/:path*` → `http://localhost:8001/api/:path*` for local dev, so the browser can call the backend same-origin without CORS during `next dev`.
- `src/context/AuthContext.js` caches the current user in `localStorage` (`auth_user`) purely for optimistic UI; the real source of truth is always a `GET` to the backend's `/me`-style endpoint on refresh, with localStorage cleared on any failure. Don't treat the localStorage copy as authoritative.
- `src/context/BookingContext.js` persists the in-progress booking draft (property, dates, guest counts) to `localStorage` (`bayhome.bookingDraft.v1`) and rehydrates client-side only, starting from a fixed default on the server to keep SSR markup stable.
- UI primitives (`src/components/ui`) follow the shadcn/ui "new-york" style (see `components.json`); path aliases (`@/components`, `@/lib`, `@/hooks`, etc.) are configured there and in `jsconfig.json`.
- Env vars: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

### Admin panel — `TheBayHome-AdminPanel` (Vite + React Router)
- **This codebase is a generic multi-vertical rental-admin template, not a property-specific app.** `src/config/vertical.js` is the single source of truth for which rental vertical is active (property, car, bike, equipment, hotel room, etc.) — pages and components reference `vertical.item.*` rather than hardcoding "property", so route slugs, labels, and icons all come from this config. The active preset is `propertyVertical` ("TheKeysVibe · Property Rentals"). When reading page/route code, mentally substitute "Property" wherever you see `vertical.item`.
- Routing is centralized in `src/App.jsx` using `react-router-dom` v7 with lazy-loaded route components. All authenticated routes are nested under `AdminRoute` (`src/router/ProtectedRoute.jsx`), which also exports a plain `ProtectedRoute` for authenticated-but-non-admin-strict screens.
- `src/lib/api.js` is an Axios instance (`withCredentials: true`, base URL from `VITE_API_URL`, default `https://api.thekeysvibe.com/api`) with domain-grouped API objects (`authApi`, etc.) rather than one generic request function like the frontend uses.
- `src/contexts/AuthContext.jsx` and `src/contexts/ThemeContext.jsx` provide auth/theme state; `@tanstack/react-query` (`src/lib/queryClient.js`) handles server-state caching for everything else.
- Rich text editing (blog CMS) uses TipTap (`@tiptap/react`, `@tiptap/starter-kit`).
- `vite.config.js` sets a strict CSP dev-server header (`connect-src` allowlists `localhost:*` and `https://api.thekeysvibe.com`) and enables the React Compiler babel plugin by default (disable via `REACT_COMPILER=0`).
- Deploys to Vercel as an SPA (`vercel.json` rewrites all paths to `index.html`).
- Env var: `VITE_API_URL`.

### Backend — `TheBayHome-Backend` (Express 5 + Prisma/PostgreSQL, built for this POC)
- Layout: `src/routes/` → `src/controllers/` → Prisma (`src/lib/prisma.js`). Everything is mounted under `/api` in `src/app.js`.
- **The frontend and admin panel expect Mongo-shaped JSON** (`_id` instead of `id`, nested `price`/`images`/`location` objects on a property, `userId`/`propertyId` populated as sub-documents on a booking, a `bookingStatus`/`totalAmount`/`bookingId` naming convention). `src/lib/serialize.js` is where every Prisma row gets translated into that shape before going out — when adding a field, add it there, not just in the Prisma schema, or the frontend won't see it. Money fields are plain whole-dollar integers (matching the frontend's `formatCurrency`, which does not divide by 100 — this is **not** a Stripe-style cents convention).
- Auth is a JWT in an httpOnly cookie (`src/lib/jwt.js`, `src/middleware/auth.js`), read on every request by an always-on `attachUser` middleware so both public and admin routes can check `req.user`. `requireAuth`/`requireAdmin` gate individual routes; role check is `req.user.role === "Admin"` (capital A, matches the admin panel's own check).
- Signup is OTP-gated (`src/lib/otp.js`): `POST /otp/send-otp` issues a 6-digit code tied to an email+purpose, `POST /auth/register` consumes it. No email provider is wired up — codes are printed to the backend's own console (`[OTP] ... code for ...`). `POST /auth/register`'s response shape intentionally deviates from the rest of the API (`{message, user}`, not `{data}`) — that's not a bug, the frontend's `AuthContext.signup()` reads `data.user` directly.
- Booking pricing (season lookup, per-night segments, cleaning/service fee, tax) is computed server-side in `src/controllers/booking.controller.js` (`computePricing`) and mirrors the client-side estimate in `AvailabilityCard.jsx` almost line for line — if the season-pricing logic changes on one side, change it on the other too.
- Image uploads (`src/lib/storage.js`) go through a storage abstraction that speaks the S3 API (`@aws-sdk/client-s3`) when `BUCKET`/`ACCESS_KEY_ID`/`SECRET_ACCESS_KEY`/`ENDPOINT` are set, and falls back to local disk under `./uploads` (served at `/uploads/...`) otherwise. Those env var names deliberately match what Railway auto-injects when you attach a Bucket to a service — pointing this at a Railway Bucket later is a variables-only change, no code change.
- Not implemented: blog CMS, things-to-do CMS, error-log endpoints (the admin panel's `blogsApi`, `thingsToDoApi`, `errorLogsApi` will all 404 against this backend). Also not implemented: real email delivery, Google OAuth login, BullMQ/Redis job queue — the original README's documented stack for those was Mongo-specific and wasn't carried over.

#### Deploying (Railway)
- `Dockerfile` is written with **repo-root-relative** `COPY` paths (`COPY TheBayHome-Backend/ .`) per this account's Railway playbook — Railway's Docker build context is always the repo root regardless of a service's configured root directory, even though `rootDirectory` is still set on the service (it affects watch paths, not the Docker context).
- Migrations run as Railway's **pre-deploy command** (`npx prisma migrate deploy`), configured on the service, not baked into the Dockerfile's `CMD` — the container's `CMD` only starts the server.
- Project `staynest-booking-poc` (Railway) has `staging` and `production` environments. As of the last session, `staging` has: a Postgres service (official `postgres` template, SSL-enabled image, with a volume), the backend service configured with the Dockerfile builder/rootDirectory/dockerfilePath/preDeployCommand/healthcheck (`/api/health`) above, all required env vars set (`DATABASE_URL` wired via `${{Postgres.DATABASE_URL}}` reference), and a generated domain (`staynest-booking-poc-staging.up.railway.app`). `production` still has its default Railpack-builder config untouched. Nothing has been pushed to the GitHub repo (`ramseychad1/staynest-booking-poc`) yet, so no build has succeeded there — that's the one remaining step.

## Cross-app conventions
- All three apps talk over cookie-based sessions (`credentials: "include"` / `withCredentials: true`), not bearer tokens in headers — auth state depends on the backend's CORS/cookie config allowing the calling origin.
- Booking lifecycle (documented in README, enforced by the backend): `pending` → `accepted`/`rejected` → (`accepted` can be marked paid) → `booked` → optionally `cancelled` (with optional refund).
