# Hotel Reservation System

A full-stack hotel reservation system built as a monorepo.

## Structure

```
hotel-reservation-system/
├── apps/
│   ├── api/              # Node.js + Express + TypeScript backend
│   └── web/              # React 18 + Vite + TypeScript frontend
├── packages/
│   └── shared/           # Shared types, enums, and Zod schemas
├── docker-compose.yml    # PostgreSQL service
└── README.md
```

## Prerequisites

- Node.js >= 18
- Yarn
- Docker & Docker Compose

## Getting Started

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Start PostgreSQL:
   ```bash
   docker-compose up -d
   ```

3. Run the API:
   ```bash
   yarn dev:api
   ```

4. Run the Web app:
   ```bash
   yarn dev:web
   ```

## Workspaces

- `@hotel/api` — Express backend
- `@hotel/web` — React frontend
- `@hotel/shared` — Shared types and validation schemas
