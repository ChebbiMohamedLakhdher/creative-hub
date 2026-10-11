# CreativeHub

A full-stack user-generated content platform built with Next.js 14, allowing creators to showcase 3D models, images, audio files, and PDFs.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Local JSON store
- **Auth:** Clerk
- **Storage:** Local filesystem uploads
- **3D Viewer:** @google/model-viewer
- **Deployment:** Vercel

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

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
creative-hub/
├── app/                    # Next.js App Router pages & API routes
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── viewers/            # Category-specific media viewers
│   └── providers/          # Context providers
├── lib/                    # Utilities, local store & auth helpers
├── types/                  # TypeScript type definitions
├── data/                   # Local JSON store
└── public/uploads/         # Uploaded files
```

## Deployment

1. Push to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add the Clerk environment variables
4. Deploy
5. Update Clerk webhook URL and allowed origins with your Vercel domain

## Local Data

This version stores app data in `data/store.json` and saves uploads under `public/uploads/`.
It is intentionally simple and best suited to local development or a single-instance deployment.

## License

MIT
