# Business Ops

Single-user app for tracking clients, leads, and payments — a prioritized, at-a-glance view, not a content/project pipeline. Next.js (App Router) + TypeScript + Tailwind v4 + Supabase, deployed on Vercel. Built mobile-first as an installable PWA.

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase project values
npm run dev
```

## Database

Schema lives in `supabase/migrations/`. Push with the Supabase CLI:

```bash
npx supabase db push --db-url "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
```

## Auth

Google sign-in via Supabase Auth. Access is restricted to a single owner email, checked in `app/(protected)/layout.tsx` (`OWNER_EMAIL` env var) and enforced again at the database layer via the `is_owner()` RLS policy in the schema migration.
