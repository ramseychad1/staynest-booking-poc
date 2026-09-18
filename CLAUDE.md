# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state — read this first

This repo was originally wired as three git **submodules** (`TheBayHome-Frontend`, `TheBayHome-AdminPanel`, `TheBayHome-Backend`), but it ships with no `.gitmodules` file, so the submodule links were broken and the folders were empty on checkout.

- `TheBayHome-Frontend` and `TheBayHome-AdminPanel` have been pulled in as regular (non-submodule) files from their upstream repos (`github.com/ashraf-work/TheBayHome-Frontend` and `github.com/ashraf-work/TheBayHome-AdminPanel`), at the exact commits this repo originally pinned. They are real, readable source going forward.
- `TheBayHome-Backend` is **still missing**. No public repo for it could be located under the same GitHub account. Nothing in this repo currently describes its actual implementation — only the architecture/env vars documented in `README.md`, which is unverified against real code. Don't assume backend implementation details beyond what `README.md` states; if you need to work on the backend, ask where its source lives.

## What this project is

**StayNest** ("TheKeysVibe" in code) is a full-stack Airbnb-style vacation rental booking platform for boutique properties in the Florida Keys, split into three apps:

| App | Folder | Stack | Purpose |
|---|---|---|---|
| Public website | `TheBayHome-Frontend` | Next.js 16 / React 19 | Customer-facing booking site |
| Admin console | `TheBayHome-AdminPanel` | Vite / React 19 | Internal ops dashboard + CMS |
| Backend API | `TheBayHome-Backend` | Express 5 / MongoDB (per README; **source not present**) | REST API, auth, bookings, uploads, email jobs |

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
Source is not present in this checkout — see "Repository state" above. Per `README.md`, local dev would be `npm install && npm run dev`, serving `http://localhost:8001/api`, and it depends on MongoDB, Redis, and an AWS S3 bucket being reachable.

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

### Backend — `TheBayHome-Backend` (per README only — verify against real source once located)
Documented shape: Express 5 + Mongoose/MongoDB, JWT + signed-cookie sessions, Zod validation, Multer + AWS S3 uploads, BullMQ/Redis for background email jobs, rate limiting and sanitization middleware, centralized error logging. Directory layout described in `README.md`: `controllers/`, `models/`, `routes/`, `services/`, `queues/`, `validators/`, `utils/`.

## Cross-app conventions
- All three apps talk over cookie-based sessions (`credentials: "include"` / `withCredentials: true`), not bearer tokens in headers — auth state depends on the backend's CORS/cookie config allowing the calling origin.
- Booking lifecycle (documented in README, enforced by the backend): `pending` → `accepted`/`rejected` → (`accepted` can be marked paid) → `booked` → optionally `cancelled` (with optional refund).
