# SpedCentral

A directory of special education providers, specialists, and products —
launching in Houston, TX, built to expand nationwide.

## Stack

- **Astro + Tailwind CSS** — static-first for speed and SEO, deployed on Cloudflare Pages
- **Supabase (Postgres)** — providers, products, categories, reviews (see `supabase/`)
- **Cloudflare R2** — provider photos, logos, product images, via a small Worker route (`worker/index.ts`)
- Deployed as a **Cloudflare Worker with static assets** (Workers Builds, Git-connected) -- not classic Cloudflare Pages; see `wrangler.toml`
- Editorial content (guides, IEP help) lives as Astro content collections, not the database

## Development

```sh
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev
```

## Database

Run these in the Supabase SQL editor, in order, when setting up a new project:

1. `supabase/schema.sql` — full table/RLS definitions
2. `supabase/seed_geography.sql` — states + Houston-metro cities
3. `supabase/seed_categories.sql` — reference data + the full service/product category taxonomy
4. `supabase/migration_001_product_image_fallback.sql` — adds `products.image_icon`/`image_tint`
5. `supabase/migration_002_product_key_features.sql` — adds `products.key_features`

`supabase/db-reference.json` is a plain-language data dictionary of every table/column — useful when working on the DB without re-reading `schema.sql` line by line.

## Image uploads (Cloudflare R2)

This site deploys as a **Cloudflare Worker with static assets** (Workers Builds, connected to GitHub) — not classic Cloudflare Pages. `wrangler.toml` is what defines that: `[assets]` serves the Astro `dist/` build directly for every route, except `run_worker_first = ["/api/*"]`, which sends only `/api/*` requests to `worker/index.ts` instead. That script handles provider photo/logo (and later, product image) uploads: resizes to a max 1600px width and re-encodes to WebP before writing to R2 — this happens at *upload* time, not build time, since these files don't exist yet when Astro builds the static site.

One-time setup, in the Cloudflare dashboard:

1. R2 → Create bucket (this repo's `wrangler.toml` assumes it's named `spedcentral-media` — rename there if yours differs).
2. Bucket → Settings → Public access → enable the `r2.dev` URL or connect a custom subdomain (e.g. `media.yourdomain.com`). Put that URL in `PUBLIC_R2_BASE_URL` (see `.env.example`).
3. That's it for bindings — `wrangler.toml`'s `[[r2_buckets]]` block declares the `MEDIA_BUCKET` binding in code, so it deploys automatically with the Worker rather than needing to be clicked together by hand in the dashboard.

No API keys/secrets are needed for the upload route itself — the R2 binding is how Cloudflare authenticates it, scoped to this Worker. `PUBLIC_R2_BASE_URL` is only used for *reading* images back (building `<img src>` from the object key stored in `photo_url`/`logo_url`/`image_url`).

Object keys follow `{entityType}/{slug}/{slot}.webp` — e.g. `providers/thrive-speech-therapy/hero.webp`, `providers/thrive-speech-therapy/gallery-0.webp` — kept human-readable and keyword-bearing on purpose (image-filename SEO, easier to eyeball in the R2 dashboard) rather than a random hash.

## Project structure

```
src/
  components/   Astro components (homepage sections, shared UI)
  layouts/      Base page layout with SEO meta defaults
  lib/          Supabase client + data-access layer (src/lib/data.ts)
  pages/        Routes (file-based)
  styles/       Tailwind v4 global stylesheet + design tokens
supabase/       SQL schema + seed data
```

## Design notes

### Why provider/product IDs are generated client-side, not by the database

Every table uses `gen_random_uuid()`, which mints a random, unique ID for
each row — not a counted-up sequence. That randomness is what makes it safe
to generate the ID *before* anything is saved: when the "Add my listing"
form is submitted, the app generates the row's UUID itself (client-side)
before touching the database at all. The same client-side moment also
computes the row's `slug` (needed either way, since `slug` is `not null
unique` on `providers`/`products`) — and that slug, not the UUID, is what
keys the R2 upload path (`providers/{slug}/hero.webp`), so image filenames
stay human-readable instead of opaque. Photos upload (and get their keys
back) *before* the provider row insert fires, so `photo_url`/`logo_url` are
set in that same insert — no separate "attach the image after the fact"
step or update.

### Product category taxonomy (9 groups)

Modeled on a researched competitor's proven nav structure, with two of
their sub-categories intentionally left out (`Supplements` — unregulated
health claims are a common source of misinformation aimed at autism
parents; `Autism Awareness` merch — off-brand for a clinical-feeling
directory).

- **Sensory Products** — Calming & Deep Pressure, Movement & Active Seating, Oral Motor Tools, Sensory Swings, Sensory Room Equipment, Stimulation Tools, Ear Muffs & Auditory Sensitivity
- **Communication & Language** — AAC Devices, PECS & Communication Boards, Sign Language Resources, Speech Therapy & Visual Communication Tools, Reading & Writing Aids, Vision & Hearing Assistive Devices
- **Fine & Gross Motor Skills** — Fine Motor Tools, Gross Motor Tools
- **Behavior & Social Skills** — Behavior Management, Calming Products, Social Skills Development
- **Daily Living & Self-Care** — Adaptive Clothing, Feeding Tools, Toileting & Bathing Aids, Safety & Wandering Prevention, Mobility & Positioning Equipment, Adult Independent Living Tools
- **Learning & Education** — Visual Supports, Adapted School Supplies, Digital Downloads & Printables, Educational Software & Apps, Books, Sensory-Friendly Classroom Tools
- **Sleep & Relaxation** — Sleep Aids, Body Socks & Compression Sheets
- **Therapy Tools** — ABA/OT/Speech Therapy Tools, Sensory Diet Kits & Visual Therapy Tools
- **Toys, Games & Fidgets** — Sensory/Educational/Calming Toys, Interactive Games & Pretend Play, Fidgets

37 sub-categories total.
