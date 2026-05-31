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

---

### Detailed Test Cases

#### Authentication Tests (13 tests) — `auth.test.tsx`

Tests for user registration, login, and access control:

| Test | Description |
|------|-------------|
| `returns 201 with user data and token when registration succeeds` | New user can register and receives JWT token |
| `returns 409 Conflict when email is already registered` | Duplicate email registration is rejected |
| `returns 400 when password is missing` | Password validation works |
| `returns 201 with token when login succeeds` | Valid credentials return JWT |
| `returns 401 when login credentials are invalid` | Wrong password returns unauthorized |
| `returns 401 when user does not exist` | Non-existent user returns unauthorized |
| `returns 200 with user data when getting current user` | Protected /me endpoint returns user info |
| `returns 401 when accessing /me without token` | Unauthenticated access to /me is blocked |
| `returns 403 when customer tries to access hotel-admin dashboard` | RBAC: CUSTOMER cannot access HOTEL_ADMIN routes |
| `returns 403 when hotel-admin tries to access system-admin dashboard` | RBAC: HOTEL_ADMIN cannot access SYSTEM_ADMIN routes |
| `returns 200 when system-admin accesses system-admin dashboard` | RBAC: SYSTEM_ADMIN has full access |
| `returns 401 when accessing hotel-admin dashboard without token` | Unauthenticated admin access is blocked |
| `returns 403 when customer tries to access hotel-admin bookings` | RBAC: Customer cannot list hotel bookings |

#### Hotel Search Tests (18 tests) — `hotel-search.test.tsx`

Tests for hotel search and filtering:

| Test | Description |
|------|-------------|
| `returns all hotels when no filters applied` | Default search returns all hotels |
| `returns hotels by location (city name)` | Search by city name works |
| `returns hotels by hotel name` | Search by hotel name works |
| `returns empty array when no hotels match location` | No results handling works |
| `filters hotels by price range (minPrice)` | Minimum price filter works |
| `filters hotels by price range (maxPrice)` | Maximum price filter works |
| `filters hotels by price range (minPrice and maxPrice)` | Combined price range filter works |
| `filters hotels by room type` | Room type (SINGLE, DOUBLE, SUITE) filter works |
| `filters hotels by amenity (wifi)` | Amenity filter (wifi) works |
| `filters hotels by amenity (parking)` | Amenity filter (parking) works |
| `filters hotels by multiple amenities` | Multiple amenity filters work |
| `returns hotels filtered by price above maxPrice` | Price upper bound filter works |
| `returns hotels filtered by price below minPrice` | Price lower bound filter works |
| `returns all hotels when only minPrice is provided` | Single bound price filter works |
| `returns all hotels when only maxPrice is provided` | Single bound price filter works |
| `search by non-existent city returns empty results` | Invalid city returns empty |
| `search with no matching filters returns empty` | No matching filters returns empty |
| `combined city and price filter works correctly` | Multiple filters work together |

#### Room Availability & Booking Tests (36 tests) — `room-availability-booking.test.tsx`

Tests for room availability checking and booking creation:

**Availability Tests:**
| Test | Description |
|------|-------------|
| `returns available when room has free capacity` | Room shows availability when not fully booked |
| `returns unavailable when room is already booked for overlapping dates` | Availability decreases for booked dates |
| `returns available for non-overlapping dates` | Different dates show availability |

**Double Booking Prevention Tests (CRITICAL):**
| Test | Description |
|------|-------------|
| `prevents double booking for exact same dates` | Same check-in/check-out blocked (409) |
| `prevents booking for overlapping dates (contained within existing)` | Inner overlap blocked with DATE_OVERLAP code |
| `prevents booking for overlapping dates (extends before existing)` | Overlap at start blocked |
| `prevents booking for overlapping dates (extends after existing)` | Overlap at end blocked |
| `prevents booking when new booking surrounds existing` | Outer overlap blocked |
| `prevents booking for completely contained dates` | Contained booking blocked |
| `allows booking for adjacent dates (check-out = next check-in)` | Adjacent bookings allowed |
| `allows booking for dates before existing booking` | Earlier booking allowed |
| `allows booking for dates after existing booking` | Later booking allowed |

**Booking CRUD Tests:**
| Test | Description |
|------|-------------|
| `creates booking with valid data` | Valid booking returns 201 with booking data |
| `creates booking and returns booking id` | Booking creation returns unique ID |
| `creates booking with correct status CONFIRMED` | New bookings have CONFIRMED status |
| `returns 401 when unauthenticated user tries to book` | Unauthenticated booking blocked |
| `returns 400 when checkIn date is missing` | Missing check-in date validation |
| `returns 400 when checkOut date is missing` | Missing check-out date validation |
| `returns 400 when roomId is missing` | Missing room ID validation |
| `returns 400 when numberOfGuests exceeds capacity` | Guest count validation works |
| `returns user's bookings with correct structure` | GET /bookings returns user bookings |
| `returns empty array when user has no bookings` | No bookings returns empty array |
| `returns booking details by ID` | GET /bookings/:id returns correct data |
| `returns 404 when booking ID does not exist` | Invalid booking ID returns 404 |
| `returns 403 when trying to view another user's booking` | IDOR protection works |
| `cancels booking successfully` | Cancel endpoint returns 200 |
| `returns 404 when cancelling non-existent booking` | Cancel invalid ID returns 404 |
| `returns updated booking with CANCELLED status after cancellation` | Cancelled booking shows CANCELLED status |
| `returns 400 when cancelling already cancelled booking` | Double cancellation blocked |

#### Admin Tests (20 tests) — `admin.test.tsx`

Tests for hotel admin and system admin operations:

**Hotel Admin Authentication & Authorization:**
| Test | Description |
|------|-------------|
| `hotel admin can access dashboard with valid token` | HOTEL_ADMIN can access dashboard |
| `rejects unauthenticated request to hotel admin dashboard` | 401 for no token |
| `rejects normal user accessing hotel admin dashboard` | 403 for CUSTOMER role |
| `rejects system-admin accessing hotel admin dashboard` | 403 for SYSTEM_ADMIN on wrong scope |

**Room Management:**
| Test | Description |
|------|-------------|
| `hotel admin can add room to own hotel` | POST /hotels/:id/rooms works |
| `hotel admin can update room details` | PUT /hotels/:id/rooms/:roomId works |
| `hotel admin can delete room from own hotel` | DELETE /hotels/:id/rooms/:roomId works |
| `rejects hotel admin adding room to another hotel` | Cross-hotel room creation blocked |
| `hotel admin can view own hotel bookings` | GET /hotel-admin/bookings works |
| `hotel admin can filter bookings by status` | Status filter on bookings works |
| `hotel admin can confirm pending booking` | PUT /hotel-admin/bookings/:id/confirm works |
| `hotel admin can check-in booking` | PUT /hotel-admin/bookings/:id/check-in works |
| `hotel admin can check-out booking` | PUT /hotel-admin/bookings/:id/check-out works |
| `hotel admin can cancel booking` | PUT /hotel-admin/bookings/:id/cancel works |

**System Admin Tests:**
| Test | Description |
|------|-------------|
| `system-admin can access system dashboard with valid token` | SYSTEM_ADMIN dashboard access works |
| `rejects hotel-admin accessing system dashboard` | 403 for HOTEL_ADMIN on SYSTEM_ADMIN route |
| `system-admin can view all hotels` | GET /admin/hotels works |
| `system-admin can verify a hotel` | PUT /admin/hotels/:id/verify works |
| `system-admin can list all users` | GET /admin/users works |
| `system-admin can update user role` | PUT /admin/users/:id/role works |

#### Review Tests (11 tests) — `review.test.tsx`

Tests for hotel reviews and ratings:

| Test | Description |
|------|-------------|
| `authenticated user can submit review` | POST /reviews creates review with 201 |
| `unauthenticated user cannot submit review` | 401 for unauthenticated review |
| `rejects review with rating below 1` | Rating validation (min 1) |
| `rejects review with rating above 5` | Rating validation (max 5) |
| `rejects review with missing comment` | Comment required validation |
| `rejects duplicate review from same user for same hotel` | One review per user per hotel |
| `returns reviews for hotel with pagination` | GET /reviews/hotel/:id with pagination |
| `returns reviews sorted by creation date (newest first)` | Sort order correct |
| `calculates correct average rating for hotel` | Average rating calculation correct |
| `returns empty array when hotel has no reviews` | No reviews returns empty |
| `system-admin can delete any review` | Admin review deletion works |

#### Integration Tests (9 tests) — `integration.test.tsx`

Full workflow integration tests:

| Test | Description |
|------|-------------|
| `Complete booking flow: Register -> Search -> Check Availability -> Book -> View History` | Full user journey from registration to booking |
| `Admin creates room -> User searches -> User books -> User cancels` | Admin + user workflow |
| `Double booking prevention: First booking succeeds, second is rejected` | Critical overlap protection |
| `Hotel verification: System admin verifies hotel -> Hotel appears in search` | Admin verification workflow |
| `Review workflow: User books -> User reviews -> Review appears on hotel page` | Booking + review flow |
| `RBAC enforcement: All three roles access their respective endpoints` | Role-based access validation |
| `Search with multiple filters returns correct results` | Complex filter combinations |
| `User cannot access other user's booking details` | IDOR protection across flows |
| `Concurrent booking attempts for same room/dates: First succeeds, second fails` | Race condition handling |

---

### Double Booking Prevention Algorithm

The system prevents the same room from being double-booked using this algorithm:

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

**Visual representation of overlap cases:**

```
Existing Booking:    |==========|
New Booking:              |==========|    → Overlaps at end     ❌

Existing Booking:              |==========|
New Booking:    |==========|          → Overlaps at start    ❌

Existing Booking:       |==========|
New Booking:      |====|               → Contains within      ❌

Existing Booking:   |====|
New Booking: |====================|    → Surrounds existing   ❌

Existing Booking: |==========|
New Booking:                    |====| → After (non-overlapping) ✅

Existing Booking:             |==========|
New Booking: |====|                 → Before (non-overlapping) ✅

Existing Booking: |==========|
New Booking:                    |==|     → Adjacent (check-out = next check-in) ✅
```

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
