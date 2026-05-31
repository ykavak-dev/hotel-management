# Hotel Reservation System - Web Frontend

A modern React 18 hotel reservation system frontend with TypeScript, featuring hotel search, room booking, and admin dashboards.

## Features

### User Features
- **Hotel Search** — Search hotels by location, filter by price, room type, and amenities
- **Room Availability** — Real-time availability checking with date range selection
- **Booking System** — Create, view, and cancel reservations
- **User Authentication** — Register, login, and profile management
- **Reviews** — Submit and view hotel reviews

### Admin Features
- **Hotel Admin Dashboard** — Manage rooms, pricing, and view bookings
- **System Admin Dashboard** — Verify hotels, manage users, moderate reviews

### Technical Highlights
- **Role-Based Access Control** — Three user roles: CUSTOMER, HOTEL_ADMIN, SYSTEM_ADMIN
- **Double Booking Prevention** — Overlapping date validation prevents double bookings
- **Full Test Coverage** — 113 tests covering API, business logic, and integrations

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18.3 |
| Build Tool | Vite 5 |
| Language | TypeScript 5.4 |
| Routing | React Router 6 |
| State/Data | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| UI Components | Radix UI + Tailwind CSS |
| Testing | Vitest + React Testing Library + MSW |
| Icons | Lucide React |

## Project Structure

```
apps/web/
├── src/
│   ├── __tests__/           # Test files
│   │   ├── mocks/           # MSW mock handlers
│   │   │   └── server.ts    # Mock API server
│   │   ├── setup.tsx        # Test configuration
│   │   ├── auth.test.tsx    # Authentication tests
│   │   ├── hotel-search.test.tsx
│   │   ├── room-availability-booking.test.tsx
│   │   ├── admin.test.tsx
│   │   ├── review.test.tsx
│   │   └── integration.test.tsx
│   ├── components/           # React components
│   │   ├── common/          # Shared UI components
│   │   ├── hotel/           # Hotel-related components
│   │   ├── booking/         # Booking components
│   │   └── hotel-admin/     # Admin panel components
│   ├── pages/               # Page components
│   │   ├── HomePage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── HotelDetailPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── MyBookingsPage.tsx
│   │   └── hotel-admin/     # Admin pages
│   ├── services/            # API service layer
│   │   └── api.ts           # Axios API client
│   ├── types/                # TypeScript type definitions
│   ├── hooks/                # Custom React hooks
│   ├── context/              # React context providers
│   ├── lib/                  # Utilities
│   └── utils/                # Helper functions
├── public/                   # Static assets
├── vitest.config.ts          # Test configuration
├── vite.config.ts           # Build configuration
├── tsconfig.json             # TypeScript configuration
└── package.json
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Or using yarn
yarn install
```

### Development

```bash
# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests Once (CI Mode)

```bash
npm run test:ci
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Test Structure

| Test File | Tests | Description |
|-----------|-------|-------------|
| `auth.test.tsx` | 13 | User registration, login, protected routes |
| `hotel-search.test.tsx` | 18 | Hotel search and filtering |
| `room-availability-booking.test.tsx` | 36 | Room availability, booking, overlap detection |
| `admin.test.tsx` | 20 | Hotel admin and system admin operations |
| `review.test.tsx` | 11 | Review submission and moderation |
| `integration.test.tsx` | 9 | Full workflow integration tests |

### Key Test Cases

**Double Booking Prevention (Critical)**
```typescript
// Existing booking: Room 101, May 10-13
// Attempted booking: May 11-12 (overlaps)
// Expected: System rejects with 409 Conflict
```

**Date Overlap Logic Tests**
- Contains within existing range
- Surrounds existing range
- Overlaps at start
- Overlaps at end
- Non-overlapping (before)
- Non-overlapping (after)
- Adjacent dates (check-out = next check-in) — allowed

**Role-Based Access Control**
- CUSTOMER cannot access admin routes → 403 Forbidden
- HOTEL_ADMIN cannot access SYSTEM_ADMIN routes → 403 Forbidden
- SYSTEM_ADMIN has access to all admin endpoints → 200 OK

## Environment Variables

Create a `.env` file in the root directory:

```env
# API URL (leave empty for development with local API)
VITE_API_URL=http://localhost:3001/api
```

### Example .env File

```env
VITE_API_URL=http://localhost:3001/api
```

## API Configuration

The frontend expects a REST API backend. The API service is configured in `src/services/api.ts`.

### Expected API Endpoints

#### Authentication
- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — User login
- `GET /api/auth/me` — Get current user

#### Hotels
- `GET /api/hotels` — List all hotels
- `GET /api/hotels/:id` — Get hotel details

#### Search
- `GET /api/search/hotels` — Search with filters
- `GET /api/search/availability` — Check room availability

#### Bookings
- `POST /api/bookings` — Create booking
- `GET /api/bookings` — Get user's bookings
- `DELETE /api/bookings/:id` — Cancel booking

#### Admin
- `GET /api/hotel-admin/dashboard` — Hotel admin dashboard
- `GET /api/admin/dashboard` — System admin dashboard

## Deployment to Vercel

### Prerequisites

- Vercel CLI or Vercel account
- Git repository

### Deploy

```bash
# Login to Vercel
vercel login

# Deploy
cd apps/web
vercel deploy
```

### Build Command

Vercel automatically runs:

```bash
cd ../../packages/shared && npm run build
cd ../../apps/web && npm run build
```

### Environment Variables

Set in Vercel dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://your-api-domain.com/api` | Backend API URL |

### Output Directory

Production build output: `dist/`

## Monorepo Structure

This package is part of a monorepo:

```
hotel-reservation-system/
├── apps/
│   ├── api/              # Express backend (not included in web deployment)
│   └── web/              # React frontend (this package)
├── packages/
│   └── shared/           # Shared TypeScript types
├── docker-compose.yml    # PostgreSQL for local development
└── package.json          # Workspace root
```

### Shared Package

The `@hotel/shared` package provides TypeScript types and Zod validation schemas used by both frontend and backend.

```typescript
import { Hotel, Room, Booking } from '@hotel/shared';
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests in watch mode |
| `npm run test:ci` | Run tests once (CI mode) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Architecture

### State Management

- **Server State** — TanStack Query for API data (caching, refetching)
- **UI State** — React useState/useReducer for local state
- **Auth State** — React Context (AuthContext)

### Authentication Flow

1. User submits login credentials
2. API returns JWT token
3. Token stored in localStorage
4. AuthContext updated with user data
5. API requests include Bearer token
6. 401 responses trigger logout redirect

### Booking Flow

1. User searches hotels with filters
2. User selects hotel and dates
3. System checks availability via API
4. User creates booking (overlap validation happens server-side)
5. Booking created with PENDING status
6. User redirected to confirmation page

### Overlap Detection Algorithm

```typescript
function isDateOverlap(
  newCheckIn: Date,
  newCheckOut: Date,
  existingCheckIn: Date,
  existingCheckOut: Date
): boolean {
  // Overlap if: new starts before existing ends AND new ends after existing starts
  return newCheckIn < existingCheckOut && newCheckOut > existingCheckIn;
}
```

## Testing Strategy

### Test Categories

1. **Unit Tests** — Individual functions, helpers
2. **Integration Tests** — API handlers with MSW
3. **Component Tests** — React components with testing library
4. **E2E Workflows** — Full user journeys

### MSW (Mock Service Worker)

Tests use MSW to intercept API requests:

```typescript
// src/__tests__/mocks/server.ts
export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Test Isolation

Each test runs against a fresh mock server state. The `beforeEach` hook in `setup.tsx` resets the `testStore` to ensure no test pollution.

## Troubleshooting

### Tests Not Found

Ensure `vitest.config.ts` has correct include pattern:

```typescript
include: ['**/src/__tests__/**/*.test.{ts,tsx}']
```

### Build Errors

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

2. Build shared package first:
   ```bash
   cd ../../packages/shared
   npm run build
   ```

### Type Errors

1. Run TypeScript check:
   ```bash
   npx tsc --noEmit
   ```

2. Check for path alias issues in `tsconfig.json`

## License

Private - All rights reserved
