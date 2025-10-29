# Database Setup Guide

## Prerequisites

- MySQL database (local or remote)
- Node.js and npm installed

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the database URL:

```bash
cp .env.example .env
```

Edit `.env` and set your database connection:
```env
DATABASE_URL="mysql://root@localhost:3306/dm_building"
```

Or if you have a password:
```env
DATABASE_URL="mysql://root:password@localhost:3306/dm_building"
```

### 3. Generate Prisma Client

```bash
npm run db:generate
```

### 4. Run Migrations

This will create all the database tables:

```bash
npm run db:migrate
```

When prompted for a migration name, you can use: `init`

### 5. Seed the Database

This will populate initial data (admin user, materials, etc.):

```bash
npm run db:seed
```

### 6. Verify Setup

You can use Prisma Studio to view your database:

```bash
npm run db:studio
```

## Seed Data

The seed script creates:

- **Admin User**: `admin@dm-building.com` / `admin123`
- **CM Team User**: `cm@dm-building.com` / `cm123456`
- **Expert User**: `expert@dm-building.com` / `expert123`
- **Customer User**: `customer@example.com` / `customer123`
- **5 Sample Materials**: Flooring, tiles, paint, lighting, furniture
- **System Settings**: Default configuration values

## Available Scripts

- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed the database
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Troubleshooting

### Migration Issues

If you need to reset the database:

```bash
npx prisma migrate reset
```

This will drop the database, recreate it, and run all migrations + seed.

### Connection Issues

Make sure MySQL is running and the connection string in `.env` is correct.

**Create database manually (if needed):**
```sql
CREATE DATABASE dm_building CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

