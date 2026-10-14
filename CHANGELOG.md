# Changelog

## Unreleased

### Phase 1 - PostgreSQL persistence

- Added the Prisma PostgreSQL schema for users, projects, categories, likes,
  views, daily view aggregates, comments, follows, notifications, reports, and
  project events.
- Added the singleton Prisma client in `lib/db.ts`.
- Replaced application reads and writes used by the existing routes with Prisma
  services in `lib/store.ts`.
- Added an idempotent, Zod-validated JSON-to-PostgreSQL migration script.
- Kept `data/store.json` as a one-time migration source. Runtime writes now go
  to PostgreSQL, and production uploads use Supabase Storage.
