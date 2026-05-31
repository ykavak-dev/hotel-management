# Hotel Reservation System

A modern, full-stack hotel reservation system with React frontend, Express backend, and comprehensive test coverage.

## Features

### User Features
- **Hotel Search** — Search hotels by location, filter by price, room type, and amenities
- **Room Availability** — Real-time availability checking with date range selection
- **Booking System** — Create, view, and cancel reservations
- **User Authentication** — Register, login, and profile management with JWT
- **Reviews** — Submit and view hotel reviews

### Admin Features
- **Hotel Admin Dashboard** — Manage rooms, pricing, and view bookings
- **System Admin Dashboard** — Verify hotels, manage users, moderate reviews

### Technical Highlights
- **Role-Based Access Control** — Three user roles: CUSTOMER, HOTEL_ADMIN, SYSTEM_ADMIN
- **Double Booking Prevention** — Overlapping date validation prevents double bookings
- **Full Test Coverage** — 113 tests covering API, business logic, and integrations

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Express.js, TypeScript, Prisma |
| Database | PostgreSQL |
| Testing | Vitest, React Testing Library, MSW, Jest |
| Auth | JWT with refresh tokens |

## Project Structure

```
hotel-reservation-system/
├── apps/
│   ├── api/              # Express backend
│   │   └── src/
│   │       ├── routes/    # API routes
│   │       ├── services/  # Business logic
│   │       ├── middleware/# Auth, validation
│   │       └── utils/    # Helpers
│   └── web/              # React frontend
│       └── src/
│           ├── __tests__/ # 113 tests
│           ├── components/# UI components
│           ├── pages/    # Page components
│           ├── services/ # API client
│           └── hooks/    # Custom hooks
├── packages/
│   └── shared/           # Shared types & Zod schemas
└── docker-compose.yml   # PostgreSQL
```

## Quick Start

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose

### Installation

```bash
# Install dependencies
yarn install

# Start PostgreSQL
docker-compose up -d

# Run API
yarn dev:api

# Run Web (in another terminal)
yarn dev:web
```

### Test Credentials

| Role | Email | Password |
|------|-------|---------|
| Customer | test@example.com | password123 |
| Hotel Admin | hoteladmin@example.com | password123 |
| System Admin | sysadmin@example.com | password123 |

## Testing

### Frontend Tests (113 tests)

```bash
# Run all tests
yarn test:frontend

# Run with coverage
yarn test:coverage

# Run once (CI)
yarn test:ci
```

### Test Coverage

| Category | Tests | Description |
|----------|-------|-------------|
| Authentication | 13 | Register, login, protected routes, RBAC |
| Hotel Search | 18 | Location, price, room type, amenities filters |
| Room Booking | 36 | Availability, overlap detection, CRUD |
| Admin | 20 | Hotel admin, system admin operations |
| Reviews | 11 | Submission, rating validation |
| Integration | 9 | Full workflows, double booking prevention |

### Double Booking Prevention

Critical test case that prevents the same room being booked twice for overlapping dates:

```typescript
// Existing: Room 101, May 10-13
// Attempted: May 11-12 (overlaps)
// Result: System rejects with 409 Conflict
```

## API Endpoints

### Authentication
- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user

### Hotels
- `GET /api/hotels` — List hotels
- `GET /api/hotels/:id` — Hotel details

### Search
- `GET /api/search/hotels` — Search with filters
- `GET /api/search/availability` — Check availability

### Bookings
- `POST /api/bookings` — Create booking
- `GET /api/bookings` — User's bookings
- `DELETE /api/bookings/:id` — Cancel

### Admin
- `GET /api/hotel-admin/dashboard` — Hotel admin stats
- `GET /api/admin/dashboard` — System admin stats

## Deployment

### Vercel (Frontend)

```bash
cd apps/web
vercel deploy
```

Set environment variable:
```
VITE_API_URL=https://your-api-domain.com/api
```

### Railway/Render (Backend)

```bash
cd apps/api
# Deploy to Railway or Render
# Set DATABASE_URL environment variable
```

## Architecture

### Double Booking Prevention

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

### Role-Based Access Control

```
CUSTOMER     → Book hotels, view own bookings, write reviews
HOTEL_ADMIN  → Manage own hotel rooms, view hotel bookings
SYSTEM_ADMIN → Verify hotels, manage users, moderate reviews
```

## Scripts

| Command | Description |
|---------|-------------|
| `yarn dev:api` | Start backend |
| `yarn dev:web` | Start frontend |
| `yarn build:api` | Build backend |
| `yarn build:web` | Build frontend |
| `yarn test:frontend` | Run frontend tests |
| `yarn test:backend` | Run backend tests |
| `yarn lint:api` | Lint backend |
| `yarn lint:web` | Lint frontend |

## License

Private — All rights reserved
