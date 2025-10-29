# DM Building - Home Renovation Simulation & Consulting Platform

This monorepo contains the backend (Express + TypeScript + Prisma + MySQL) and frontend (Next.js + TypeScript + TailwindCSS) for the DM Building platform.

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL/MariaDB on `localhost:3306`

### Backend
```
cd backend
cp .env.example .env   # ensure DATABASE_URL is set
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```
- Health: `GET http://localhost:5000/health`
- API base: `http://localhost:5000/api`

### Frontend
```
cd frontend
npm install
npm run dev
```
- App: `http://localhost:3000`

## Authentication
- JWT (access + refresh tokens)
- `/api/auth`: register, login, refresh, me
- Admin routes protected by role `admin`

## Admin
- Fixed header + sidebar
- Users, Materials, Categories
- Materials page:
  - Pagination and page size (25, 40, 100)
  - Filters synced to URL (`page`, `limit`, `categoryId`, `isActive`, `search`)
  - Category tree with expand/collapse and icons
  - Debounced search, URL updates client-side (no full reload)
  - Unit column displayed

## Database & Prisma
- Run migrations and seed:
```
cd backend
npx prisma migrate dev
npm run db:seed
```

## Troubleshooting
- Types mismatch after schema change: `npx prisma generate`
- Admin flash on unauthorized: ensure client-side check + `window.location.replace`
- MariaDB/XAMPP notes: see `backend/DATABASE_SETUP.md`

## Scripts
- Backend: `dev`, `db:generate`, `db:migrate`, `db:seed`
- Frontend: `dev`

## Notes
- `materials.unit` is required (no default). Admin must supply when creating/editing.
- Search term `+` is normalized to space on both client and server.


