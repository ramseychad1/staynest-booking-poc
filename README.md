<div align="center">
<img src="https://img.shields.io/badge/🏠%20StayNest-Vacation%20Rental%20Platform-1a1a2e?style=for-the-badge" width="300"/>
  <h1>StayNest — Vacation Rental Booking Platform</h1>

  <p>
    A full-stack boutique vacation rental platform for StayNest stays, built with a public booking website,
    a secure admin operations dashboard, and a production-ready Express/MongoDB API.
  </p>

<img src="https://skillicons.dev/icons?i=react,nextjs,js,express,nodejs,tailwind,mongodb,redis&theme=dark" />
</div>

---

## Preview

### Web App

<p align="center">
  <img src="ScreenShots/WebApp/Screenshot from 2026-06-10 14-36-18.png" alt="Staynest homepage" width="100%" />
</p>

<p align="center">
  <img src="ScreenShots/WebApp/Screenshot from 2026-06-10 14-37-20.png" alt="Properties listing" width="49%" />
  <img src="ScreenShots/WebApp/Screenshot from 2026-06-10 14-37-37.png" alt="Things to do page" width="49%" />
</p>

### Admin Panel

<p align="center">
  <img src="ScreenShots/AdminPanel/Screenshot from 2026-06-10 14-40-59.png" alt="Admin dashboard analytics" width="100%" />
</p>

<p align="center">
  <img src="ScreenShots/AdminPanel/Screenshot from 2026-06-10 14-41-34.png" alt="Booking management" width="49%" />
  <img src="ScreenShots/AdminPanel/Screenshot from 2026-06-10 14-41-25.png" alt="Property management" width="49%" />
</p>

---

## What This Project Is

**StayNest** is an Airbnb-style rental booking system designed for boutique vacation homes in the Florida Keys. Guests can browse properties, inspect galleries, view seasonal rates, choose dates, create an account, and submit booking requests. Admins can manage listings, seasonal pricing, bookings, users, blogs, local guide content, and backend error logs from a dedicated operations dashboard.

This repository is split into three production-focused applications:

| App            | Folder                  | Purpose                                                       |
| -------------- | ----------------------- | ------------------------------------------------------------- |
| Public Website | `TheBayHome-Frontend`   | Customer-facing Next.js booking experience                    |
| Backend API    | `TheBayHome-Backend`    | Express/MongoDB REST API, auth, bookings, uploads, email jobs |
| Admin Console  | `TheBayHome-AdminPanel` | Admin-only React dashboard for operations and CMS             |

---

## Core Features

- Property discovery with rich galleries, amenities, pricing, Google Maps embeds, and availability selection.
- Checkout flow with inline sign-in/sign-up, OTP email verification, guest details, and booking submission.
- Seasonal pricing engine with date windows, min/max night rules, and weighted nightly pricing.
- Booking lifecycle management: `pending`, `accepted`, `rejected`, `booked`, `cancelled`.
- Manual payment operations for accepted bookings: mark paid and process refunds.
- User account system with email/password, Google login support, profile updates, password reset, and signed-cookie sessions.
- Admin dashboard with KPIs, revenue charts, booking status distribution, and recent booking activity.
- Property CMS with thumbnail/gallery uploads, amenities, fees, capacity, location, and status controls.
- Blog CMS with rich text editing, drafts, publishing, tags, slug management, and thumbnails.
- Things To Do CMS for restaurants, fishing, bird watching, and local recommendations.
- Contact form email delivery.
- Centralized backend error logging with admin review and delete tools.
- AWS S3 media storage, Redis/BullMQ email queue, rate limiting, sanitization, and role-based access control.

---

## Tech Stack

### Frontend - Customer Web App

| Area               | Tools                                                          |
| ------------------ | -------------------------------------------------------------- |
| Framework          | Next.js 16, React 19                                           |
| Styling            | Tailwind CSS 4, custom design tokens                           |
| UI                 | Radix UI, custom component library, Lucide icons               |
| Forms & Validation | React Hook Form, Zod                                           |
| Auth UX            | Cookie session API integration, Google OAuth client support    |
| Data Fetching      | Native `fetch`, server caching/revalidation, client-side state |
| Booking UX         | React Day Picker, date-fns, local booking draft persistence    |

### Backend API

| Area           | Tools                                                               |
| -------------- | ------------------------------------------------------------------- |
| Runtime        | Node.js, Express 5                                                  |
| Database       | MongoDB, Mongoose                                                   |
| Authentication | JWT, signed cookies, DB-backed sessions, bcrypt                     |
| Validation     | Zod                                                                 |
| File Uploads   | Multer, AWS S3 SDK                                                  |
| Email          | Resend/Nodemailer templates                                         |
| Jobs           | BullMQ, Redis/ioredis                                               |
| Security       | CORS allowlist, rate limits, request sanitization, security headers |
| Observability  | Persistent error logs with severity/status/request metadata         |

### Admin Panel

| Area           | Tools                                                |
| -------------- | ---------------------------------------------------- |
| Framework      | Vite, React 19                                       |
| Routing        | React Router                                         |
| Data Layer     | TanStack Query, Axios                                |
| UI             | Radix UI, Tailwind CSS 4, Lucide icons               |
| Charts         | Recharts                                             |
| Forms          | React Hook Form, Zod                                 |
| Rich Text      | TipTap editor                                        |
| Access Control | Admin-only route guard using backend role validation |

---

## Application Architecture

```txt
thebayhome-app/
├── TheBayHome-Frontend/       # Public Next.js web app
│   ├── src/app/               # App Router pages
│   ├── src/components/        # Layout, home, property, UI components
│   ├── src/context/           # Auth and booking draft state
│   └── src/services/api.js    # Public web API client
│
├── TheBayHome-Backend/        # Express REST API
│   ├── controllers/           # Request handlers
│   ├── models/                # Mongoose schemas
│   ├── routes/                # API route modules
│   ├── services/              # Business logic
│   ├── queues/                # Email job queue and worker
│   ├── validators/            # Zod validation schemas
│   └── utils/                 # S3, responses, rate limits, sanitizers
│
├── TheBayHome-AdminPanel/     # Admin dashboard
│   ├── src/pages/             # Dashboard, properties, bookings, CMS, users
│   ├── src/components/        # Shell, common UI, forms
│   ├── src/contexts/          # Auth and theme state
│   └── src/lib/api.js         # Admin API client
│
└── ScreenShots/               # GitHub README screenshots
```

---

## Booking Lifecycle

```txt
Guest selects property and dates
          ↓
Checkout validates account + guest details
          ↓
Backend checks property, dates, capacity, seasons, pricing
          ↓
Booking is created as pending
          ↓
Admin accepts or rejects booking
          ↓
Accepted booking can be marked paid
          ↓
Paid booking becomes booked
          ↓
Admin can cancel and optionally refund
```

---

## API Modules

| Module       | Capabilities                                                     |
| ------------ | ---------------------------------------------------------------- |
| Auth         | Register, login, Google login, forgot password, reset password   |
| OTP          | Send OTP for registration verification                           |
| User         | Current user, logout, profile update, password update, all users |
| Property     | Public listings, detail, admin create/update/delete, uploads     |
| Season       | Per-property seasonal pricing windows                            |
| Booking      | Create booking, user bookings, admin booking actions, analytics  |
| Blog         | Public blog listing/detail, admin CMS actions                    |
| Things To Do | Local guide listing/detail, admin CMS actions                    |
| Contact      | Contact form email                                               |
| Error Logs   | Admin-only error log listing/detail/delete                       |

---

## Local Development

### 1. Backend

```bash
cd TheBayHome-Backend
npm install
npm run dev
```

Default backend expectation:

```txt
http://localhost:8001/api
```

### 2. Frontend

```bash
cd TheBayHome-Frontend
npm install
npm run dev
```

Public app:

```txt
http://localhost:4000
```

The frontend includes a local rewrite from `/api/*` to `http://localhost:8001/api/*`.

### 3. Admin Panel

```bash
cd TheBayHome-AdminPanel
npm install
npm run dev
```

Admin console:

```txt
http://localhost:5173
```

---

## Environment Variables

### Backend `.env`

```env
APP_ENV=development
SERVER_PORT=8001
MONGO_URI=
CLIENT_URLS=http://localhost:4000,http://localhost:5173

JWT_SECRET=
COOKIE_SECRET_KEY=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

RESEND_API_KEY=
EMAIL_FROM=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Frontend `.env`

```env
NEXT_PUBLIC_SITE_URL=http://localhost:4000
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

### Admin Panel `.env`

```env
VITE_API_URL=http://localhost:8001/api
```

---

## Resume Highlights

- Built a complete full-stack rental platform with customer website, admin dashboard, and REST API.
- Implemented secure authentication with JWT signed cookies, DB-backed sessions, role guards, OTP verification, and password reset.
- Designed booking domain logic including date conflict checks, capacity validation, seasonal pricing, min/max stay rules, and booking state transitions.
- Created an admin operations console with analytics, charts, booking workflows, user management, CMS modules, and error monitoring.
- Integrated AWS S3 media uploads, Redis/BullMQ background email jobs, reusable email templates, and centralized error logging.
- Developed responsive, production-style UI using Next.js, Vite React, Tailwind CSS, Radix UI, Lucide icons, and Recharts.

---

## Security & Reliability

- Admin-only protected routes for operational tools.
- Role-based backend middleware for write operations.
- Signed HTTP cookies and persistent sessions.
- Input validation with Zod and request sanitization.
- API rate limiting for auth, contact, booking, and write endpoints.
- Sensitive data redaction in backend error logs.
- S3 cleanup when images are replaced or deleted.
- MongoDB transactions for booking creation and season conflict resolution.

---

## Screenshots Gallery

| Public Website                                                                                                        | Admin Operations                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| <img src="ScreenShots/WebApp/Screenshot from 2026-06-10 14-36-52.png" alt="Lifestyle homepage section" width="420" /> | <img src="ScreenShots/AdminPanel/Screenshot from 2026-06-10 14-41-17.png" alt="Admin booking volume" width="420" /> |
| <img src="ScreenShots/WebApp/Screenshot from 2026-06-10 14-37-42.png" alt="Blog page" width="420" />                  | <img src="ScreenShots/AdminPanel/Screenshot from 2026-06-10 14-42-10.png" alt="Users management" width="420" />     |
| <img src="ScreenShots/WebApp/Screenshot from 2026-06-10 14-37-56.png" alt="Contact page" width="420" />               | <img src="ScreenShots/AdminPanel/Screenshot from 2026-06-10 14-42-20.png" alt="Error logs" width="420" />           |

---

## Project Status

The project already includes the main production modules for a real booking platform:

- Public booking website
- Backend API
- Admin dashboard
- Property and content CMS
- Booking and seasonal pricing logic
- Auth, email, uploads, analytics, and error logs

Planned production enhancements could include direct payment gateway integration, automated refund handling, calendar sync with external platforms, and advanced search/filtering on the public property pages.

---

<div align="center">
  <p>
    Built as a polished full-stack portfolio project for vacation rental operations, booking management, and content publishing.
  </p>
</div>
