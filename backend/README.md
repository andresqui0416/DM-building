# Backend (Express + TypeScript)

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn
- PostgreSQL (local or remote) for later steps

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Server runs on http://localhost:5000

## Scripts

- `pnpm dev` — run in watch mode (ts-node-dev)
- `pnpm build` — compile TypeScript to dist
- `pnpm start` — run compiled server

## Health Check

GET `/health` → `{ status: 'ok' }`


