# Hotel Reservation System

A modern, full-stack hotel reservation system with React frontend, Express backend, and comprehensive test coverage.

## Overview

This is a **monorepo** project containing a React web application for hotel reservations. The system allows users to search hotels, check room availability, make bookings, and leave reviews. It also includes admin dashboards for hotel management and system administration.

> **Note:** This project uses the **web** part (React frontend). The backend (Express API) is not included in this deployment.

---

## Features

### User Features
- **Hotel Search** — Search hotels by location, filter by price range, room type, and amenities
- **Room Availability** — Real-time availability checking with date range selection
- **Booking System** — Create, view, and cancel reservations
- **User Authentication** — Register, login, and profile management with JWT
- **Reviews** — Submit and view hotel reviews with ratings

### Admin Features
- **Hotel Admin Dashboard** — Manage rooms, pricing, and view hotel bookings
- **System Admin Dashboard** — Verify hotels, manage users, moderate reviews

### Technical Highlights
- **Role-Based Access Control (RBAC)** — Three user roles: CUSTOMER, HOTEL_ADMIN, SYSTEM_ADMIN
- **Double Booking Prevention** — Overlapping date validation prevents double bookings
- **Full Test Coverage** — 113 tests covering authentication, search, booking, admin operations, and integrations

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18.3, TypeScript 5.4, Vite 5 |
| Styling | Tailwind CSS, Radix UI |
| State Management | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| Routing | React Router 6 |
| HTTP Client | Axios |
| Testing | Vitest, React Testing Library, MSW v2 |
| Package Manager | Bun |

---

## Project Structure

```
hotel-reservation-system/
├── apps/
│   └── web/                      # React frontend (USED FOR DEVELOPMENT)
│       ├── src/
│       │   ├── __tests__/        # 113 tests
│       │   │   ├── mocks/        # MSW mock handlers
│       │   │   │   └── server.ts # Mock API server
│       │   │   ├── setup.tsx     # Test configuration
│       │   │   ├── auth.test.tsx
│       │   │   ├── hotel-search.test.tsx
│       │   │   ├── room-availability-booking.test.tsx
│       │   │   ├── admin.test.tsx
│       │   │   ├── review.test.tsx
│       │   │   └── integration.test.tsx
│       │   ├── components/       # React components
│       │   ├── pages/           # Page components
│       │   ├── services/         # API client
│       │   ├── hooks/           # Custom React hooks
│       │   ├── context/         # AuthContext
│       │   └── types/           # TypeScript types
│       ├── public/              # Static assets
│       ├── vitest.config.ts    # Test configuration
│       ├── vite.config.ts      # Build configuration
│       └── package.json
├── packages/
│   └── shared/                  # Shared types & Zod schemas
└── package.json                 # Workspace root
```

---

## Quick Start with Bun

### Prerequisites

- **Bun** (latest version) — [Install Bun](https://bun.sh)
- Node.js >= 18 (required for some dependencies)

### Step 1: Install Dependencies

```bash
# Install all dependencies using Bun
bun install
```

### Step 2: Configure Environment

Create a `.env` file in `apps/web/`:

```env
# API URL - leave empty if using mock data
VITE_API_URL=

# Enable mock mode (uses built-in mock data instead of real API)
VITE_USE_MOCK=true
```

### Step 3: Run Development Server

```bash
# Navigate to web app
cd apps/web

# Start development server with Bun
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing

### Test Overview

This project has **113 tests** covering all major features:

| Test File | Count | Description |
|-----------|-------|-------------|
| `auth.test.tsx` | 13 | User registration, login, protected routes, RBAC |
| `hotel-search.test.tsx` | 18 | Location, price, room type, amenities filters |
| `room-availability-booking.test.tsx` | 36 | Room availability, overlap detection, CRUD operations |
| `admin.test.tsx` | 20 | Hotel admin and system admin operations |
| `review.test.tsx` | 11 | Review submission, rating validation, moderation |
| `integration.test.tsx` | 9 | Full workflow integration tests |

### Run Tests

```bash
# Navigate to web app
cd apps/web

# Run all tests in watch mode
bun test

# Run tests once (CI mode)
bun test --run

# Run tests with coverage report
bun test --coverage
```

### Test Categories Explained

#### Authentication Tests (13 tests)
- User registration with validation
- Login with correct/incorrect credentials
- Protected route access
- Role-Based Access Control (RBAC)
- JWT token handling

#### Hotel Search Tests (18 tests)
- Search by location
- Filter by price range
- Filter by room type
- Filter by amenities
- Combined filters
- Empty results handling

#### Room Availability & Booking Tests (36 tests)
- Check room availability for date range
- Create booking with valid data
- **Double booking prevention** — Overlapping date validation
- Cancel booking
- View user's bookings
- Error handling for unavailable rooms

#### Admin Tests (20 tests)
- Hotel admin dashboard access
- Room management (create, update, delete)
- View hotel bookings
- System admin access
- RBAC enforcement (admin routes protected)

#### Review Tests (11 tests)
- Submit review for booked hotel
- View hotel reviews
- Rating validation (1-5 stars)
- Prevent duplicate reviews
- Review moderation (admin)

#### Integration Tests (9 tests)
- Complete booking workflow
- Search → Select → Book → Cancel flow
- Admin create room → verify availability
- Double booking prevention (critical)

### Double Booking Prevention Algorithm

The system prevents the same room from being double-booked:

```typescript
function isDateOverlap(
  newCheckIn: Date,
  newCheckOut: Date,
  existingCheckIn: Date,
  existingCheckOut: Date
): boolean {
  return newCheckIn < existingCheckOut && newCheckOut > existingCheckIn;
}
```

**Test Cases for Overlap Detection:**
- New booking **contains** existing booking — ❌ Blocked
- New booking **surrounds** existing booking — ❌ Blocked
- New booking **overlaps at start** — ❌ Blocked
- New booking **overlaps at end** — ❌ Blocked
- New booking **before** existing — ✅ Allowed
- New booking **after** existing — ✅ Allowed
- Check-out = next check-in (adjacent) — ✅ Allowed

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Customer | test@example.com | password123 |
| Hotel Admin | hoteladmin@example.com | password123 |
| System Admin | sysadmin@example.com | password123 |

---

## Development

### Available Scripts

From the `apps/web/` directory:

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build |
| `bun test` | Run tests in watch mode |
| `bun test --run` | Run tests once |
| `bun test --coverage` | Run with coverage |
| `bun run lint` | Run ESLint |
| `bun run format` | Format with Prettier |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001/api` | Backend API URL |
| `VITE_USE_MOCK` | `true` | Enable mock mode (no backend needed) |

### Mock Mode

When `VITE_USE_MOCK=true`, the app uses MSW (Mock Service Worker) to simulate API responses. This allows full frontend development without a running backend.

Mock data includes:
- 3 hotels with rooms
- Sample bookings
- Test users for each role

### Architecture

#### State Management
- **Server State** — TanStack Query for API data (caching, background refetching)
- **UI State** — React useState/useReducer for local component state
- **Auth State** — React Context (AuthContext) for authentication

#### Authentication Flow
1. User submits login credentials
2. API returns JWT token (or mock returns mock token)
3. Token stored in localStorage
4. AuthContext updated with user data
5. API requests include Bearer token
6. 401 responses trigger logout redirect

#### Booking Flow
1. User searches hotels with filters
2. User selects hotel and dates
3. System checks availability via API
4. User creates booking
5. Overlap validation happens server-side (or MSW mock)
6. Booking created with CONFIRMED status
7. User redirected to confirmation

#### Role-Based Access Control
```
CUSTOMER     → Book hotels, view own bookings, write reviews
HOTEL_ADMIN  → Manage own hotel rooms, view hotel bookings
SYSTEM_ADMIN → Verify hotels, manage users, moderate reviews
```

---

## Deployment

### Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy web app
cd apps/web
vercel deploy
```

### Environment Variables on Vercel

Set in Vercel dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://your-api-domain.com/api` | Your backend API URL |
| `VITE_USE_MOCK` | `false` | Disable mock mode |

### Build Command

Vercel automatically runs:

```bash
cd ../../packages/shared && npm run build
cd ../../apps/web && npm run build
```

### Output Directory

Production build output: `dist/`

---

## API Endpoints (Expected)

The frontend expects these API endpoints from the backend:

### Authentication
- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — User login
- `GET /api/auth/me` — Get current user

### Hotels
- `GET /api/hotels` — List all hotels
- `GET /api/hotels/:id` — Get hotel details

### Search
- `GET /api/search/hotels` — Search with filters
- `GET /api/search/availability` — Check room availability

### Bookings
- `POST /api/bookings` — Create booking
- `GET /api/bookings` — Get user's bookings
- `PUT /api/bookings/:id/cancel` — Cancel booking

### Reviews
- `GET /api/reviews/hotel/:id` — Get hotel reviews
- `POST /api/reviews` — Create review
- `GET /api/reviews/can-review` — Check if user can review

### Admin
- `GET /api/hotel-admin/dashboard` — Hotel admin stats
- `GET /api/hotel-admin/bookings` — Hotel bookings list
- `GET /api/admin/dashboard` — System admin stats

---

## Troubleshooting

### Tests Not Found

Ensure `vitest.config.ts` has correct include pattern:

```typescript
include: ['**/src/__tests__/**/*.test.{ts,tsx}']
```

### Build Errors

1. Clear dependencies and reinstall:
   ```bash
   rm -rf node_modules bun.lock
   bun install
   ```

2. Build shared package first:
   ```bash
   cd packages/shared
   bun run build
   ```

### Type Errors

```bash
cd apps/web
npx tsc --noEmit
```

### Bun Specific Issues

If you encounter issues with Bun:
```bash
# Update Bun to latest version
bun update

# Clear Bun cache
bun --help
```

---

## License

Private — All rights reserved

---

## Credits

Developed with React, TypeScript, Vitest, and modern web technologies.
