# SpedCentral

A directory of special education providers, specialists, and products —
launching in Houston, TX, built to expand nationwide.

## Stack

- **Astro + Tailwind CSS** — static-first for speed and SEO, deployed on Vercel
- **Supabase (Postgres)** — providers, products, categories, reviews (see `supabase/`)
- **Cloudflare R2** — provider photos, logos, product images
- Editorial content (guides, IEP help) lives as Astro content collections, not the database

## Development

```sh
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev
```

## Database

`supabase/schema.sql` — full table/RLS definitions.
`supabase/seed_categories.sql` — reference data + the full service/product category taxonomy.

Run both in the Supabase SQL editor, in that order, when setting up a new project.

## Project structure

```
src/
  components/   Astro components (homepage sections, shared UI)
  layouts/      Base page layout with SEO meta defaults
  lib/          Supabase client
  pages/        Routes (file-based)
  styles/       Tailwind v4 global stylesheet + design tokens
supabase/       SQL schema + seed data
```
