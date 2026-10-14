# CreativeHub

A full-stack user-generated content platform built with Next.js 14, allowing creators to showcase 3D models, images, audio files, and PDFs.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL via Prisma (Supabase, Neon, or local Postgres)
- **Auth:** Clerk
- **Storage:** Supabase Storage on Vercel, local filesystem in development
- **3D Viewer:** @google/model-viewer
- **Deployment:** Vercel

## Architecture

```mermaid
flowchart LR
  Browser --> Next[Next.js App Router]
  Next --> Auth[Clerk]
  Next --> Store[lib/store.ts]
  Store --> Prisma[lib/db.ts]
  Prisma --> Postgres[(PostgreSQL)]
  Next --> Files[Supabase Storage]
```

## Features

- Sign up / Sign in with Clerk (email + Google OAuth)
- Upload projects with drag-and-drop (3D, Image, Audio, PDF)
- Content discovery with search, filters, and pagination
- Project detail pages with category-specific viewers
- User portfolio pages
- Like/unlike with optimistic UI updates
- Dark/light mode
- Responsive design

## Getting Started

### 1. Clone and install

```bash
cd creative-hub
npm install
```

### 2. Set up Clerk

1. Create an application at [clerk.com](https://clerk.com)
2. Enable Email and Google OAuth providers
3. Add a webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
4. Subscribe to events: `user.created`, `user.updated`, `user.deleted`

### 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your keys:

```bash
cp .env.local.example .env.local
```

### 4. Set up PostgreSQL and migrate existing data

Create a PostgreSQL database on Neon, Supabase, or another PostgreSQL provider,
then add its connection strings as `DATABASE_URL` and `DIRECT_URL` in both
`.env.local` and a root `.env` file. On Supabase, `DATABASE_URL` should be the
pooled URI (port 6543, with `pgbouncer=true`) and `DIRECT_URL` should be the
direct URI (port 5432). Next.js reads `.env.local`, while the Prisma CLI reads
`.env` and does not automatically load `.env.local`. The root `.env` file is
ignored by Git.

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run migrate:json
```

On PowerShell, you can alternatively provide the variable for one migration
session without creating `.env`:

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
npm run prisma:migrate -- --name init
npm run migrate:json
```

Verify the JSON migration output before removing the legacy `data/store.json`
file. The migration is idempotent and prints expected and actual row counts.

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run with Docker Compose

Docker Compose starts PostgreSQL, waits for it to become healthy, applies
Prisma migrations, and starts the production Next.js server:

```bash
docker compose --env-file .env.local up --build
```

Open [http://localhost:3000](http://localhost:3000). PostgreSQL data and local
uploads are stored in named Docker volumes. To stop the services while keeping
the data:

```bash
docker compose down
```

To remove the containers and their stored data:

```bash
docker compose down -v
```

For Prisma commands run directly from PowerShell, set `DATABASE_URL` first:

```powershell
$env:DATABASE_URL="postgresql://creative_hub:creative_hub_dev@localhost:5432/creative_hub"
npm run prisma:generate
npm run prisma:migrate -- --name init
```

Alternatively, copy `.env.docker.example` to `.env` for local Docker
development. Never commit real database or Clerk credentials.

Clerk values can be supplied through the shell or a local `.env` file. The
Compose defaults are suitable only for local development.

## Project Structure

```
creative-hub/
├── app/                    # Next.js App Router pages & API routes
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── viewers/            # Category-specific media viewers
│   └── providers/          # Context providers
├── lib/                    # Database, auth helpers & application services
├── types/                  # TypeScript type definitions
├── prisma/                 # PostgreSQL schema and migrations
└── public/uploads/         # Uploaded files
```

## Deployment

Vercel serverless functions cannot write `data/store.json` or `public/uploads`.
Use Supabase Postgres for application data and Supabase Storage for files.

1. Push this Prisma-based codebase to GitHub (not the old JSON store).
2. In Supabase, run Prisma migrations against the database, or let the Vercel
   build command run `prisma migrate deploy`.
3. In Supabase Storage, create a **public** bucket named `uploads`.
4. Import the project on [Vercel](https://vercel.com) and set:
   - `DATABASE_URL` (Supabase pooled URI, port 6543, `pgbouncer=true`)
   - `DIRECT_URL` (Supabase direct URI, port 5432)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET=uploads`
   - Clerk keys and `CLERK_WEBHOOK_SECRET`
5. Deploy, then update the Clerk webhook URL and allowed origins with your
   Vercel domain.

The service role key is server-only. Do not prefix it with `NEXT_PUBLIC_`.

## Database and storage

Application data is stored in PostgreSQL through the singleton Prisma client in
`lib/db.ts`. Uploads go to Supabase Storage when `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` are set. Local disk is used only for development
and Docker.

### Indexing decisions

- `Project(categoryId, createdAt)` supports category feeds ordered by recency.
- `Project(status, visibility)` avoids returning removed or non-public projects.
- `Like(projectId)` supports fast project like counts and lookups.
- `View(projectId, createdAt)` supports time-window analytics.
- Unique constraints on Clerk IDs, usernames, and `(userId, projectId)` prevent
  duplicate identities and likes.

## Decisions

- PostgreSQL was selected over SQLite because the target deployment needs a
  managed relational database, concurrent writes, and a path to full-text search.
- Prisma centralizes typed database access and makes the migration reproducible.
- `ViewDailyAggregate` keeps daily counters available without replacing the
  append-only `View` audit trail.
- JSON data is retained until the first migration is verified; this avoids
  destructive cleanup if the destination database is misconfigured.

## License

MIT
